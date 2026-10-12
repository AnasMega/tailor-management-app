import { NextRequest, NextResponse } from "next/server";
import { pool, ensureDbInitialized } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    await ensureDbInitialized();
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get("shopId");
    const orderId = searchParams.get("orderId");

    let query = `
      SELECT oc.*,
        c.full_name as customer_name,
        c.phone as customer_phone,
        c.customer_code,
        s.name as shop_name
      FROM order_complaints oc
      LEFT JOIN customers c ON oc.customer_id = c.id
      LEFT JOIN shops s ON oc.shop_id = s.id
      WHERE 1=1
    `;

    const params: (string | number)[] = [];
    if (shopId && shopId !== "all") {
      params.push(Number(shopId));
      query += ` AND oc.shop_id = $${params.length} `;
    }
    if (orderId) {
      params.push(Number(orderId));
      query += ` AND oc.order_id = $${params.length} `;
    }

    query += ` ORDER BY oc.id DESC `;

    const res = await pool.query(query, params);
    return NextResponse.json({ complaints: res.rows });
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
    const actor = body.performed_by || "Master Anas (Owner / Admin)";

    if (action === "resolve_complaint") {
      const { complaint_id, order_id, amount_collected_now, payment_method, notes } = body;

      await client.query("BEGIN");

      if (complaint_id) {
        await client.query(
          `UPDATE order_complaints
           SET status = 'Resolved & Re-Delivered',
               resolved_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [complaint_id]
        );
      } else if (order_id) {
        await client.query(
          `UPDATE order_complaints
           SET status = 'Resolved & Re-Delivered',
               resolved_at = CURRENT_TIMESTAMP
           WHERE order_id = $1 AND status != 'Resolved & Re-Delivered'`,
          [order_id]
        );
      }

      const ordRes = await client.query("SELECT * FROM orders WHERE id = $1 FOR UPDATE", [
        order_id,
      ]);
      if (ordRes.rows.length > 0) {
        const ord = ordRes.rows[0];
        const collected = Number(amount_collected_now || 0);
        const newPaid = Number(ord.total_paid) + collected;
        const newBal = Math.max(0, Number(ord.total_amount) - newPaid);

        await client.query(
          `UPDATE orders
           SET status = 'Delivered',
               delivered_at = CURRENT_TIMESTAMP,
               total_paid = $1,
               balance_due = $2,
               notes = CASE WHEN $3 != '' THEN $3 ELSE notes END
           WHERE id = $4`,
          [newPaid, newBal, notes || "", order_id]
        );

        if (collected > 0) {
          await client.query(
            `UPDATE customers SET current_balance = current_balance - $1 WHERE id = $2`,
            [collected, ord.customer_id]
          );

          const receiptNo = `ALT-PAY-${Date.now().toString().slice(-6)}`;
          await client.query(
            `INSERT INTO payments_ledger (receipt_number, customer_id, order_id, shop_id, entry_type, amount, payment_method, created_by, description)
             VALUES ($1, $2, $3, $4, 'DELIVERY_PAYMENT', $5, $6, $7, $8)`,
            [
              receiptNo,
              ord.customer_id,
              ord.id,
              ord.shop_id,
              collected,
              payment_method || "Cash",
              actor,
              `Payment collected on Re-Delivery after Alteration for Order #${ord.order_number}`,
            ]
          );
        }

        await client.query(
          `INSERT INTO audit_logs (entity_type, entity_ref, action_title, details, performed_by)
           VALUES ('COMPLAINT', $1, 'Alteration / Complaint Resolved & Re-Delivered', $2, $3)`,
          [
            ord.order_number,
            `Order #${ord.order_number} re-stitched and delivered to customer${
              collected > 0 ? ` (Collected Rs. ${collected.toLocaleString()})` : ""
            }`,
            actor,
          ]
        );
      }

      await client.query("COMMIT");
      return NextResponse.json({ success: true });
    }

    // Create New Complaint / Alteration / Return / Compensation on Delivered Order
    const {
      order_id,
      complaint_type,
      fault_tags,
      issue_description,
      financial_action,
      extra_charge_to_customer,
      customer_paid_now,
      paid_to_customer_refund,
      bill_reduction_amount,
      payment_method,
      new_order_status,
      new_delivery_date,
      assigned_karigar,
      updated_measurements,
      updated_order_notes,
    } = body;

    if (!order_id || !issue_description) {
      return NextResponse.json(
        { error: "Order ID and Problem / Fault Description are required." },
        { status: 400 }
      );
    }

    await client.query("BEGIN");

    const ordRes = await client.query("SELECT * FROM orders WHERE id = $1 FOR UPDATE", [
      order_id,
    ]);
    if (ordRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const ord = ordRes.rows[0];
    const maxCmpRes = await client.query(
      "SELECT COALESCE(MAX(id), 100) + 1 as next_id FROM order_complaints"
    );
    const complaintNumber = `CMP-${100 + Number(maxCmpRes.rows[0].next_id)}`;

    const extraCharge = Number(extra_charge_to_customer || 0);
    const custPaidNow = Number(customer_paid_now || 0);
    const refundPaidToCust = Number(paid_to_customer_refund || 0);
    const billReduction = Number(bill_reduction_amount || 0);

    const targetStatus =
      new_order_status ||
      (complaint_type === "SUIT_RETURN_REFUND" ? "Returned" : "Alteration");

    const cmpStatus =
      targetStatus === "Returned"
        ? "Returned / Refunded"
        : targetStatus === "Delivered"
        ? "Resolved & Closed"
        : "In Alteration (Re-Stitching)";

    const insertCmpRes = await client.query(
      `INSERT INTO order_complaints (
        complaint_number, order_id, order_number, customer_id, shop_id,
        complaint_type, fault_tags, issue_description, financial_action,
        extra_charge_to_customer, customer_paid_now, paid_to_customer_refund, bill_reduction_amount,
        payment_method, new_delivery_date, assigned_karigar, updated_measurements,
        status, created_by
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7::jsonb, $8, $9,
        $10, $11, $12, $13,
        $14, $15, $16, $17::jsonb,
        $18, $19
      ) RETURNING *`,
      [
        complaintNumber,
        ord.id,
        ord.order_number,
        ord.customer_id,
        ord.shop_id,
        complaint_type || "TAILOR_FAULT_ALTERATION",
        JSON.stringify(fault_tags || []),
        issue_description.trim(),
        financial_action || "NO_CHARGE",
        extraCharge,
        custPaidNow,
        refundPaidToCust,
        billReduction,
        payment_method || "Cash",
        new_delivery_date || null,
        assigned_karigar || ord.master_tailor || "Master Cutter",
        JSON.stringify(updated_measurements || {}),
        cmpStatus,
        actor,
      ]
    );

    // Calculate Updated Order Financials
    let newTotalAmount = Number(ord.total_amount);
    let newTotalPaid = Number(ord.total_paid);
    let newDiscount = Number(ord.discount);

    if (financial_action === "CHARGE_CUSTOMER") {
      newTotalAmount += extraCharge;
      newTotalPaid += custPaidNow;
      const netUdhaarDelta = extraCharge - custPaidNow;

      if (netUdhaarDelta !== 0) {
        await client.query(
          `UPDATE customers SET current_balance = current_balance + $1 WHERE id = $2`,
          [netUdhaarDelta, ord.customer_id]
        );
      }

      if (extraCharge > 0) {
        const billRec = `ALT-BILL-${Date.now().toString().slice(-5)}`;
        await client.query(
          `INSERT INTO payments_ledger (receipt_number, customer_id, order_id, shop_id, entry_type, amount, payment_method, created_by, description)
           VALUES ($1, $2, $3, $4, 'ORDER_BILL', $5, 'System', $6, $7)`,
          [
            billRec,
            ord.customer_id,
            ord.id,
            ord.shop_id,
            extraCharge,
            actor,
            `Re-Stitching / Alteration Extra Charge on Order #${ord.order_number} (${complaintNumber})`,
          ]
        );
      }

      if (custPaidNow > 0) {
        const payRec = `ALT-RCV-${Date.now().toString().slice(-5)}`;
        await client.query(
          `INSERT INTO payments_ledger (receipt_number, customer_id, order_id, shop_id, entry_type, amount, payment_method, created_by, description)
           VALUES ($1, $2, $3, $4, 'DELIVERY_PAYMENT', $5, $6, $7, $8)`,
          [
            payRec,
            ord.customer_id,
            ord.id,
            ord.shop_id,
            custPaidNow,
            payment_method || "Cash",
            actor,
            `Alteration Payment received from customer for Order #${ord.order_number}`,
          ]
        );
      }
    } else if (financial_action === "PAY_CUSTOMER") {
      newDiscount += billReduction;
      newTotalAmount = Math.max(0, newTotalAmount - billReduction);
      newTotalPaid = Math.max(0, newTotalPaid - refundPaidToCust);

      // If bill is reduced by billReduction, customer owes less (-billReduction).
      // If tailor gave cash back (refundPaidToCust), customer received cash (+refundPaidToCust against paid balance).
      const customerBalanceDelta = -billReduction + refundPaidToCust;
      if (customerBalanceDelta !== 0) {
        await client.query(
          `UPDATE customers SET current_balance = current_balance + $1 WHERE id = $2`,
          [customerBalanceDelta, ord.customer_id]
        );
      }

      if (billReduction > 0) {
        const redRec = `RET-ADJ-${Date.now().toString().slice(-5)}`;
        await client.query(
          `INSERT INTO payments_ledger (receipt_number, customer_id, order_id, shop_id, entry_type, amount, payment_method, created_by, description)
           VALUES ($1, $2, $3, $4, 'DISCOUNT_WAIVER', $5, 'System', $6, $7)`,
          [
            redRec,
            ord.customer_id,
            ord.id,
            ord.shop_id,
            billReduction,
            actor,
            `Bill Reduced / Return Adjustment on Order #${ord.order_number} (${complaintNumber})`,
          ]
        );
      }

      if (refundPaidToCust > 0) {
        const refRec = `REF-OUT-${Date.now().toString().slice(-5)}`;
        await client.query(
          `INSERT INTO payments_ledger (receipt_number, customer_id, order_id, shop_id, entry_type, amount, payment_method, created_by, description)
           VALUES ($1, $2, $3, $4, 'UDHAAR_ADDED', $5, $6, $7, $8)`,
          [
            refRec,
            ord.customer_id,
            ord.id,
            ord.shop_id,
            refundPaidToCust,
            payment_method || "Cash",
            actor,
            `Tailor Paid Refund / Fault Compensation to Customer for Order #${ord.order_number} (${complaintNumber})`,
          ]
        );
      }
    }

    const newBalanceDue = Math.max(0, newTotalAmount - newTotalPaid);

    await client.query(
      `UPDATE orders
       SET status = $1,
           has_complaint = true,
           complaint_count = COALESCE(complaint_count, 0) + 1,
           discount = $2,
           total_amount = $3,
           total_paid = $4,
           balance_due = $5,
           delivery_date = COALESCE($6, delivery_date),
           master_tailor = COALESCE($7, master_tailor),
           notes = COALESCE($8, notes)
       WHERE id = $9`,
      [
        targetStatus,
        newDiscount,
        newTotalAmount,
        newTotalPaid,
        newBalanceDue,
        new_delivery_date || null,
        assigned_karigar || ord.master_tailor,
        updated_order_notes !== undefined ? updated_order_notes : ord.notes,
        ord.id,
      ]
    );

    // If updated measurements were provided, update order_items snapshot and customer_measurements
    if (updated_measurements && Object.keys(updated_measurements).length > 0) {
      await client.query(
        `UPDATE order_items
         SET measurement_snapshot = measurement_snapshot || $1::jsonb,
             stitching_notes = CONCAT(COALESCE(stitching_notes, ''), ' | [Alteration: ', $2::text, ']')
         WHERE order_id = $3`,
        [JSON.stringify(updated_measurements), issue_description.trim(), ord.id]
      );

      await client.query(
        `UPDATE customer_measurements
         SET measurements = measurements || $1::jsonb,
             updated_at = CURRENT_TIMESTAMP
         WHERE customer_id = $2`,
        [JSON.stringify(updated_measurements), ord.customer_id]
      );
    }

    await client.query(
      `INSERT INTO audit_logs (entity_type, entity_ref, action_title, details, performed_by)
       VALUES ('COMPLAINT', $1, $2, $3, $4)`,
      [
        ord.order_number,
        `Order Complaint / Return Logged (${complaintNumber})`,
        `Type: ${complaint_type} | Status: ${targetStatus} | Issue: ${issue_description.trim()} | Financial: ${financial_action}`,
        actor,
      ]
    );

    await client.query("COMMIT");
    return NextResponse.json({ complaint: insertCmpRes.rows[0] });
  } catch (error: unknown) {
    await client.query("ROLLBACK").catch(() => {});
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    client.release();
  }
}
