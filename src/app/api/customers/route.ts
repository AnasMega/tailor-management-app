import { NextRequest, NextResponse } from "next/server";
import { pool, ensureDbInitialized } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    await ensureDbInitialized();
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get("shopId");

    let query = `
      SELECT c.*,
        s.name as shop_name,
        (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id) as orders_count,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders o WHERE o.customer_id = c.id AND o.status != 'Cancelled') as total_billed,
        (SELECT COALESCE(SUM(total_paid), 0) FROM orders o WHERE o.customer_id = c.id AND o.status != 'Cancelled') as total_paid_orders,
        COALESCE(
          (SELECT json_agg(cm.* ORDER BY cm.category ASC)
           FROM customer_measurements cm
           WHERE cm.customer_id = c.id),
          '[]'::json
        ) as measurements_list
      FROM customers c
      LEFT JOIN shops s ON c.shop_id = s.id
    `;

    const params: (string | number)[] = [];
    if (shopId && shopId !== "all") {
      query += ` WHERE c.shop_id = $1 `;
      params.push(Number(shopId));
    }

    query += ` ORDER BY c.id DESC `;

    const res = await pool.query(query, params);
    return NextResponse.json({ customers: res.rows });
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

    if (body.action === "save_measurement") {
      const {
        customer_id,
        category,
        label,
        measurements,
        style_preferences,
        performed_by,
      } = body;
      if (!customer_id || !category) {
        return NextResponse.json(
          { error: "Customer ID and Measurement Category are required." },
          { status: 400 }
        );
      }

      const mRes = await client.query(
        `INSERT INTO customer_measurements (customer_id, category, label, measurements, style_preferences, updated_at)
         VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, CURRENT_TIMESTAMP)
         ON CONFLICT (customer_id, category)
         DO UPDATE SET
           label = EXCLUDED.label,
           measurements = EXCLUDED.measurements,
           style_preferences = EXCLUDED.style_preferences,
           updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [
          customer_id,
          category,
          label || `${category} Standard Naap`,
          JSON.stringify(measurements || {}),
          JSON.stringify(style_preferences || {}),
        ]
      );

      await client.query(
        `INSERT INTO audit_logs (entity_type, entity_ref, action_title, details, performed_by)
         VALUES ('NAAP', $1, 'Customer Naap Updated', $2, $3)`,
        [
          `CUST-ID-${customer_id}`,
          `Updated ${category} Naap measurements`,
          performed_by || "Master Anas (Owner / Admin)",
        ]
      );

      return NextResponse.json({ measurement: mRes.rows[0] });
    }

    const {
      id,
      customer_code,
      full_name,
      phone,
      whatsapp,
      address,
      shop_id,
      notes,
      opening_balance,
      measurement_category,
      measurements,
      style_preferences,
      performed_by,
    } = body;

    if (!full_name || !phone) {
      return NextResponse.json(
        { error: "Customer Name and Phone Number are required." },
        { status: 400 }
      );
    }

    await client.query("BEGIN");

    let savedCustomer;
    const actor = performed_by || "Master Anas (Owner / Admin)";

    if (id) {
      const existingRes = await client.query(
        "SELECT * FROM customers WHERE id = $1",
        [id]
      );
      const oldOpening = Number(existingRes.rows[0]?.opening_balance || 0);
      const newOpening = Number(opening_balance ?? oldOpening);
      const diff = newOpening - oldOpening;

      const updateRes = await client.query(
        `UPDATE customers
         SET full_name = $1,
             phone = $2,
             whatsapp = $3,
             address = $4,
             shop_id = $5,
             notes = $6,
             opening_balance = $7,
             current_balance = current_balance + $8
         WHERE id = $9
         RETURNING *`,
        [
          full_name.trim(),
          phone.trim(),
          whatsapp || phone.trim(),
          address || "",
          shop_id ? Number(shop_id) : 1,
          notes || "",
          newOpening,
          diff,
          id,
        ]
      );
      savedCustomer = updateRes.rows[0];

      await client.query(
        `INSERT INTO audit_logs (entity_type, entity_ref, action_title, details, performed_by)
         VALUES ('CUSTOMER', $1, 'Customer Profile & Naap Updated', $2, $3)`,
        [
          savedCustomer.customer_code,
          `Customer "${savedCustomer.full_name}" (${savedCustomer.phone}) profile and ${
            measurement_category || "Eastern"
          } Naap updated`,
          actor,
        ]
      );
    } else {
      const countRes = await client.query(
        "SELECT COALESCE(MAX(id), 1000) + 1 as next_num FROM customers"
      );
      const generatedCode =
        customer_code?.trim() || `CUST-${1000 + Number(countRes.rows[0].next_num)}`;
      const initBal = Number(opening_balance || 0);

      const insertRes = await client.query(
        `INSERT INTO customers (
           customer_code, full_name, phone, whatsapp, address, shop_id, notes, opening_balance, current_balance
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
         RETURNING *`,
        [
          generatedCode,
          full_name.trim(),
          phone.trim(),
          whatsapp || phone.trim(),
          address || "",
          shop_id ? Number(shop_id) : 1,
          notes || "",
          initBal,
        ]
      );
      savedCustomer = insertRes.rows[0];

      if (initBal !== 0) {
        const payNum = `PAY-OPEN-${savedCustomer.id}-${Date.now()
          .toString()
          .slice(-4)}`;
        await client.query(
          `INSERT INTO payments_ledger (receipt_number, customer_id, shop_id, entry_type, amount, payment_method, created_by, description)
           VALUES ($1, $2, $3, $4, $5, 'System', $6, $7)`,
          [
            payNum,
            savedCustomer.id,
            savedCustomer.shop_id,
            initBal > 0 ? "UDHAAR_ADDED" : "CREDIT_DEPOSIT",
            Math.abs(initBal),
            actor,
            initBal > 0
              ? "Opening Udhaar (Previous Pending Balance)"
              : "Opening Advance / Credit Balance",
          ]
        );
      }

      await client.query(
        `INSERT INTO audit_logs (entity_type, entity_ref, action_title, details, performed_by)
         VALUES ('CUSTOMER', $1, 'New Customer & Naap Registered', $2, $3)`,
        [
          savedCustomer.customer_code,
          `New Customer "${savedCustomer.full_name}" (${savedCustomer.phone}) created with ${
            measurement_category || "Eastern"
          } Naap`,
          actor,
        ]
      );
    }

    if (measurements && Object.keys(measurements).length > 0) {
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
          savedCustomer.id,
          cat,
          `${cat} Standard Naap`,
          JSON.stringify(measurements),
          JSON.stringify(style_preferences || {}),
        ]
      );
    }

    await client.query("COMMIT");
    return NextResponse.json({ customer: savedCustomer });
  } catch (error: unknown) {
    await client.query("ROLLBACK");
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    client.release();
  }
}
