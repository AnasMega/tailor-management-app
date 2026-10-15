import { NextRequest, NextResponse } from "next/server";
import { pool, ensureDbInitialized } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await ensureDbInitialized();
    const session = await getAuthSession(req);
    const { searchParams } = new URL(req.url);
    const requestedShopId = searchParams.get("shopId");
    const customerId = searchParams.get("customerId");

    let effectiveShopId: number | null = null;
    if (session && session.role !== "superadmin") {
      effectiveShopId = session.shop_id;
    } else if (requestedShopId && requestedShopId !== "all") {
      effectiveShopId = Number(requestedShopId);
    }

    let query = `
      SELECT pl.*,
        c.full_name as customer_name,
        c.phone as customer_phone,
        c.customer_code,
        c.current_balance as customer_current_balance,
        o.order_number,
        s.name as shop_name
      FROM payments_ledger pl
      LEFT JOIN customers c ON pl.customer_id = c.id
      LEFT JOIN orders o ON pl.order_id = o.id
      LEFT JOIN shops s ON pl.shop_id = s.id
      WHERE 1=1
    `;

    const params: (string | number)[] = [];
    if (effectiveShopId) {
      params.push(effectiveShopId);
      query += ` AND pl.shop_id = $${params.length} `;
    }
    if (customerId) {
      params.push(Number(customerId));
      query += ` AND pl.customer_id = $${params.length} `;
    }

    query += ` ORDER BY pl.id DESC LIMIT 250 `;

    const res = await pool.query(query, params);
    return NextResponse.json({ ledger: res.rows });
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
    const {
      customer_id,
      shop_id,
      entry_type,
      amount,
      payment_method,
      description,
      performed_by,
    } = body;

    if (!customer_id || !amount || Number(amount) <= 0) {
      return NextResponse.json(
        { error: "Customer and valid positive Amount are required." },
        { status: 400 }
      );
    }

    const amt = Number(amount);
    const type = entry_type || "UDHAAR_RECOVERY";
    const actor = performed_by || "Master Anas (Owner / Admin)";

    const balanceDelta = type === "UDHAAR_ADDED" ? amt : -amt;

    await client.query("BEGIN");

    const receiptNo = `KHATA-${Date.now().toString().slice(-6)}`;
    const descText =
      description ||
      (type === "UDHAAR_RECOVERY"
        ? "Customer Udhaar Wasooli (Balance Recovery)"
        : type === "CREDIT_DEPOSIT"
        ? "Customer Advance Credit Jama"
        : type === "DISCOUNT_WAIVER"
        ? "Balance Discount / Chhoot"
        : "Manual Udhaar Charge Added");

    const session = await getAuthSession(req);
    let targetShopId = shop_id ? Number(shop_id) : 1;
    if (session && session.role !== "superadmin" && session.shop_id) {
      targetShopId = session.shop_id;
    }

    const insertRes = await client.query(
      `INSERT INTO payments_ledger (receipt_number, customer_id, shop_id, entry_type, amount, payment_method, created_by, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        receiptNo,
        Number(customer_id),
        targetShopId,
        type,
        amt,
        payment_method || "Cash",
        actor,
        descText,
      ]
    );

    const custRes = await client.query(
      `UPDATE customers
       SET current_balance = current_balance + $1
       WHERE id = $2
       RETURNING *`,
      [balanceDelta, Number(customer_id)]
    );

    const updatedCust = custRes.rows[0];

    await client.query(
      `INSERT INTO audit_logs (entity_type, entity_ref, action_title, details, performed_by)
       VALUES ('KHATA', $1, $2, $3, $4)`,
      [
        receiptNo,
        `Khata ${type.replace(/_/g, " ")} Recorded`,
        `${updatedCust?.full_name || "Customer"}: Rs. ${amt.toLocaleString()} (${
          payment_method || "Cash"
        }) — New Balance: Rs. ${Number(
          updatedCust?.current_balance || 0
        ).toLocaleString()}`,
        actor,
      ]
    );

    await client.query("COMMIT");
    return NextResponse.json({
      entry: insertRes.rows[0],
      customer: updatedCust,
    });
  } catch (error: unknown) {
    await client.query("ROLLBACK").catch(() => {});
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    client.release();
  }
}
