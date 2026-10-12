import { NextRequest, NextResponse } from "next/server";
import { pool, ensureDbInitialized } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    await ensureDbInitialized();
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get("shopId");

    let query = `
      SELECT o.*,
        c.full_name as customer_name,
        c.phone as customer_phone,
        c.whatsapp as customer_whatsapp,
        c.customer_code,
        c.address as customer_address,
        c.current_balance as customer_current_balance,
        s.name as shop_name,
        s.branch_code as shop_branch_code,
        s.phone as shop_phone,
        s.address as shop_address,
        s.receipt_footer as shop_receipt_footer,
        COALESCE(
          (SELECT json_agg(oi.* ORDER BY oi.id ASC)
           FROM order_items oi
           WHERE oi.order_id = o.id),
          '[]'::json
        ) as items,
        COALESCE(
          (SELECT json_agg(oc.* ORDER BY oc.id DESC)
           FROM order_complaints oc
           WHERE oc.order_id = o.id),
          '[]'::json
        ) as complaints
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN shops s ON o.shop_id = s.id
    `;

    const params: (string | number)[] = [];
    if (shopId && shopId !== "all") {
      query += ` WHERE o.shop_id = $1 `;
      params.push(Number(shopId));
    }

    query += ` ORDER BY o.id DESC `;

    const res = await pool.query(query, params);
    return NextResponse.json({ orders: res.rows });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Database error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const client = await pool.connect();
  try {
    await ensureDbInitialized();
    const body = await req.json();
    const { action } = body;
    const actor = body.performed_by || body.created_by || "Master Anas (Owner / Admin)";

    if (action === "update_status") {
      const { order_id, status, master_tailor, delivery_date, notes } = body;

      const currentOrdRes = await client.query(
        "SELECT id, order_number, status FROM orders WHERE id = $1",
        [order_id]
      );
      if (currentOrdRes.rows.length === 0) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
      const currentOrd = currentOrdRes.rows[0];
      if (
        (currentOrd.status === "Delivered" || currentOrd.status === "Returned") &&
        status &&
        status !== currentOrd.status
      ) {
        return NextResponse.json(
          {
            error:
              "Delivered / Completed order ka direct status change lock hai. Kisi fault, silai alteration ya return ke liye 'Return / Fault / Complaint' option use karein.",
          },
          { status: 400 }
        );
      }

      const deliveredAtClause =
        status === "Delivered" ? ", delivered_at = CURRENT_TIMESTAMP" : "";

      const updateRes = await client.query(
        `UPDATE orders
         SET status = COALESCE($1, status),
             master_tailor = COALESCE($2, master_tailor),
             delivery_date = COALESCE($3, delivery_date),
             notes = COALESCE($4, notes)
             ${deliveredAtClause}
         WHERE id = $5
         RETURNING *`,
        [status, master_tailor, delivery_date || null, notes, order_id]
      );
      const updatedOrd = updateRes.rows[0];

      if (updatedOrd) {
        await client.query(
          `INSERT INTO audit_logs (entity_type, entity_ref, action_title, details, performed_by)
           VALUES ('ORDER', $1, $2, $3, $4)`,
          [
            updatedOrd.order_number,
            `Order Status Changed to ${updatedOrd.status}`,
            `Order #${updatedOrd.order_number} marked as "${updatedOrd.status}"`,
            actor,
          ]
        );
      }

      return NextResponse.json({ order: updatedOrd });
    }

    if (action === "deliver_or_collect") {
      const {
        order_id,
        amount_paid,
        extra_discount,
        payment_method,
        mark_delivered,
        description,
      } = body;

      await client.query("BEGIN");

      const ordRes = await client.query(
        "SELECT * FROM orders WHERE id = $1 FOR UPDATE",
        [order_id]
      );
      if (ordRes.rows.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      const ord = ordRes.rows[0];
      const paidNow = Number(amount_paid || 0);
      const discNow = Number(extra_discount || 0);

      const newDiscount = Number(ord.discount) + discNow;
      const newTotalAmount = Math.max(
        0,
        Number(ord.subtotal) + Number(ord.urgent_charges) - newDiscount
      );
      const newTotalPaid = Number(ord.total_paid) + paidNow;
      const newBalanceDue = Math.max(0, newTotalAmount - newTotalPaid);
      const newStatus = mark_delivered ? "Delivered" : ord.status;

      const updatedOrderRes = await client.query(
        `UPDATE orders
         SET discount = $1,
             total_amount = $2,
             total_paid = $3,
             balance_due = $4,
             status = $5,
             delivered_at = CASE WHEN $6 = true THEN CURRENT_TIMESTAMP ELSE delivered_at END
         WHERE id = $7
         RETURNING *`,
        [
          newDiscount,
          newTotalAmount,
          newTotalPaid,
          newBalanceDue,
          newStatus,
          Boolean(mark_delivered),
          order_id,
        ]
      );

      // Reduce customer's Udhaar balance by (paidNow + discNow)
      const totalReduction = paidNow + discNow;
      if (totalReduction !== 0) {
        await client.query(
          `UPDATE customers
           SET current_balance = current_balance - $1
           WHERE id = $2`,
          [totalReduction, ord.customer_id]
        );
      }

      if (paidNow > 0) {
        const receiptNo = `PAY-${Date.now().toString().slice(-6)}`;
        await client.query(
          `INSERT INTO payments_ledger (receipt_number, customer_id, order_id, shop_id, entry_type, amount, payment_method, created_by, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            receiptNo,
            ord.customer_id,
            ord.id,
            ord.shop_id,
            mark_delivered ? "DELIVERY_PAYMENT" : "UDHAAR_RECOVERY",
            paidNow,
            payment_method || "Cash",
            actor,
            description ||
              (mark_delivered
                ? `Payment collected on delivery of Order #${ord.order_number}`
                : `Installment payment received for Order #${ord.order_number}`),
          ]
        );
      }

      if (discNow > 0) {
        const discReceipt = `DISC-${Date.now().toString().slice(-6)}`;
        await client.query(
          `INSERT INTO payments_ledger (receipt_number, customer_id, order_id, shop_id, entry_type, amount, payment_method, created_by, description)
           VALUES ($1, $2, $3, $4, 'DISCOUNT_WAIVER', $5, 'System', $6, $7)`,
          [
            discReceipt,
            ord.customer_id,
            ord.id,
            ord.shop_id,
            discNow,
            actor,
            `Special discount on Order #${ord.order_number}`,
          ]
        );
      }

      await client.query(
        `INSERT INTO audit_logs (entity_type, entity_ref, action_title, details, performed_by)
         VALUES ('DELIVERY', $1, $2, $3, $4)`,
        [
          ord.order_number,
          mark_delivered
            ? "Suit Delivered & Payment Collected"
            : "Order Installment Collected",
          `Order #${ord.order_number}: Collected Rs. ${paidNow.toLocaleString()} (${
            payment_method || "Cash"
          }), Remaining Baqaya: Rs. ${newBalanceDue.toLocaleString()}`,
          actor,
        ]
      );

      await client.query("COMMIT");
      return NextResponse.json({ order: updatedOrderRes.rows[0] });
    }

    // Default: Create New Order Booking (with optional new customer & naap update)
    const {
      customer_id,
      new_customer,
      shop_id,
      booking_date,
      trial_date,
      delivery_date,
      is_urgent,
      discount,
      urgent_charges,
      advance_paid,
      payment_method,
      master_tailor,
      notes,
      items,
      save_measurements_to_profile,
      measurement_category,
      customer_measurements,
      customer_style_preferences,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "At least one stitching item is required to book an order." },
        { status: 400 }
      );
    }

    if (!delivery_date) {
      return NextResponse.json(
        { error: "Delivery date is required." },
        { status: 400 }
      );
    }

    await client.query("BEGIN");

    let targetCustomerId = customer_id ? Number(customer_id) : null;
    const targetShopId = shop_id ? Number(shop_id) : 1;

    // If booking for a brand new walk-in customer, create customer first
    if (!targetCustomerId && new_customer?.full_name && new_customer?.phone) {
      const countRes = await client.query(
        "SELECT COALESCE(MAX(id), 1000) + 1 as next_num FROM customers"
      );
      const custCode = `CUST-${1000 + Number(countRes.rows[0].next_num)}`;

      const newCustRes = await client.query(
        `INSERT INTO customers (customer_code, full_name, phone, whatsapp, address, shop_id, notes, opening_balance, current_balance)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 0)
         RETURNING id, customer_code, full_name`,
        [
          custCode,
          new_customer.full_name.trim(),
          new_customer.phone.trim(),
          new_customer.whatsapp || new_customer.phone.trim(),
          new_customer.address || "",
          targetShopId,
          new_customer.notes || "",
        ]
      );
      targetCustomerId = newCustRes.rows[0].id;

      await client.query(
        `INSERT INTO audit_logs (entity_type, entity_ref, action_title, details, performed_by)
         VALUES ('CUSTOMER', $1, 'Walk-in Customer Created During Order', $2, $3)`,
        [
          newCustRes.rows[0].customer_code,
          `Walk-in Customer "${newCustRes.rows[0].full_name}" (${new_customer.phone}) registered with Naap`,
          actor,
        ]
      );
    }

    if (!targetCustomerId) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        {
          error:
            "Please select an existing customer or enter new customer details.",
        },
        { status: 400 }
      );
    }

    // Save/Update customer Naap in customer_measurements if provided
    if (
      save_measurements_to_profile !== false &&
      customer_measurements &&
      Object.keys(customer_measurements).length > 0
    ) {
      const cat = measurement_category || "Eastern";
      await client.query(
        `INSERT INTO customer_measurements (customer_id, category, label, measurements, style_preferences, updated_at)
         VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, CURRENT_TIMESTAMP)
         ON CONFLICT (customer_id, category)
         DO UPDATE SET
           measurements = EXCLUDED.measurements,
           style_preferences = EXCLUDED.style_preferences,
           updated_at = CURRENT_TIMESTAMP`,
        [
          targetCustomerId,
          cat,
          `${cat} Standard Naap`,
          JSON.stringify(customer_measurements),
          JSON.stringify(customer_style_preferences || {}),
        ]
      );
    }

    // Calculate Order Financials
    let subtotal = 0;
    for (const item of items) {
      const qty = Math.max(1, Number(item.quantity || 1));
      const price = Number(item.unit_price || 0);
      subtotal += qty * price;
    }

    const discVal = Number(discount || 0);
    const urgVal = Number(urgent_charges || 0);
    const totalAmount = Math.max(0, subtotal + urgVal - discVal);
    const advVal = Number(advance_paid || 0);
    const balanceDue = totalAmount - advVal;

    // Generate unique Parchi / Order Number
    const maxOrdRes = await client.query(
      "SELECT COALESCE(MAX(id), 1000) + 1 as next_id FROM orders"
    );
    const orderNumber = `ORD-${1000 + Number(maxOrdRes.rows[0].next_id)}`;

    const orderRes = await client.query(
      `INSERT INTO orders (
        order_number, customer_id, shop_id, booking_date, trial_date, delivery_date,
        status, is_urgent, subtotal, discount, urgent_charges, total_amount,
        advance_paid, total_paid, balance_due, master_tailor, created_by, notes
      ) VALUES (
        $1, $2, $3, COALESCE($4, CURRENT_DATE), $5, $6,
        'Booked', $7, $8, $9, $10, $11,
        $12, $12, $13, $14, $15, $16
      ) RETURNING *`,
      [
        orderNumber,
        targetCustomerId,
        targetShopId,
        booking_date || null,
        trial_date || null,
        delivery_date,
        Boolean(is_urgent),
        subtotal,
        discVal,
        urgVal,
        totalAmount,
        advVal,
        balanceDue,
        master_tailor || "Master Cutter",
        actor,
        notes || "",
      ]
    );

    const newOrder = orderRes.rows[0];

    // Insert Order Items
    for (const item of items) {
      const qty = Math.max(1, Number(item.quantity || 1));
      const price = Number(item.unit_price || 0);
      const itemTotal = qty * price;

      const combinedSnapshot = {
        ...(customer_measurements || {}),
        ...(customer_style_preferences || {}),
        ...(item.measurement_snapshot || {}),
      };

      await client.query(
        `INSERT INTO order_items (
          order_id, garment_type_id, garment_name, quantity, unit_price, total_price,
          fabric_details, measurement_snapshot, stitching_notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9)`,
        [
          newOrder.id,
          item.garment_type_id ? Number(item.garment_type_id) : null,
          item.garment_name || "Custom Stitching",
          qty,
          price,
          itemTotal,
          item.fabric_details || "",
          JSON.stringify(combinedSnapshot),
          item.stitching_notes || "",
        ]
      );
    }

    // Update Customer's Udhaar / Credit Balance
    await client.query(
      `UPDATE customers
       SET current_balance = current_balance + $1
       WHERE id = $2`,
      [balanceDue, targetCustomerId]
    );

    // Record Ledger Entries
    const billReceipt = `BILL-${newOrder.id}-${Date.now().toString().slice(-4)}`;
    const itemsSummary = items
      .map(
        (i: { quantity: number; garment_name: string }) =>
          `${i.quantity}x ${i.garment_name}`
      )
      .join(", ");

    await client.query(
      `INSERT INTO payments_ledger (receipt_number, customer_id, order_id, shop_id, entry_type, amount, payment_method, created_by, description)
       VALUES ($1, $2, $3, $4, 'ORDER_BILL', $5, 'System', $6, $7)`,
      [
        billReceipt,
        targetCustomerId,
        newOrder.id,
        targetShopId,
        totalAmount,
        actor,
        `Order #${orderNumber} Bill (${itemsSummary})`,
      ]
    );

    if (advVal > 0) {
      const advReceipt = `ADV-${newOrder.id}-${Date.now().toString().slice(-4)}`;
      await client.query(
        `INSERT INTO payments_ledger (receipt_number, customer_id, order_id, shop_id, entry_type, amount, payment_method, created_by, description)
         VALUES ($1, $2, $3, $4, 'ADVANCE_PAYMENT', $5, $6, $7, $8)`,
        [
          advReceipt,
          targetCustomerId,
          newOrder.id,
          targetShopId,
          advVal,
          payment_method || "Cash",
          actor,
          `Advance Bayana received at Order #${orderNumber} booking`,
        ]
      );
    }

    await client.query(
      `INSERT INTO audit_logs (entity_type, entity_ref, action_title, details, performed_by)
       VALUES ('ORDER', $1, 'New Order & Parchi Booked', $2, $3)`,
      [
        orderNumber,
        `Order #${orderNumber} (${itemsSummary}) — Bill: Rs. ${totalAmount.toLocaleString()}, Advance: Rs. ${advVal.toLocaleString()}, Baqaya: Rs. ${balanceDue.toLocaleString()}`,
        actor,
      ]
    );

    await client.query("COMMIT");

    const fullOrderRes = await pool.query(
      `
      SELECT o.*,
        c.full_name as customer_name,
        c.phone as customer_phone,
        c.whatsapp as customer_whatsapp,
        c.customer_code,
        c.address as customer_address,
        c.current_balance as customer_current_balance,
        s.name as shop_name,
        s.branch_code as shop_branch_code,
        s.phone as shop_phone,
        s.address as shop_address,
        s.receipt_footer as shop_receipt_footer,
        COALESCE(
          (SELECT json_agg(oi.* ORDER BY oi.id ASC)
           FROM order_items oi
           WHERE oi.order_id = o.id),
          '[]'::json
        ) as items
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN shops s ON o.shop_id = s.id
      WHERE o.id = $1
    `,
      [newOrder.id]
    );

    return NextResponse.json({ order: fullOrderRes.rows[0] });
  } catch (error: unknown) {
    await client.query("ROLLBACK").catch(() => {});
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    client.release();
  }
}
