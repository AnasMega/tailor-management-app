import { NextRequest, NextResponse } from "next/server";
import { pool, ensureDbInitialized } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await ensureDbInitialized();
    const session = await getAuthSession(req);
    const { searchParams } = new URL(req.url);
    const requestedShopId = searchParams.get("shopId");

    let effectiveShopId: number | null = null;
    if (session && session.role !== "superadmin") {
      effectiveShopId = session.shop_id;
    } else if (requestedShopId && requestedShopId !== "all") {
      effectiveShopId = Number(requestedShopId);
    }

    const hasShopFilter = Boolean(effectiveShopId);
    const shopParams = effectiveShopId ? [effectiveShopId] : [];

    // 1. Monthly Sales Breakdown (Current Month vs Previous Months)
    const monthlyQuery = `
      SELECT
        TO_CHAR(DATE_TRUNC('month', o.booking_date), 'YYYY-MM') as month_key,
        TO_CHAR(DATE_TRUNC('month', o.booking_date), 'FMMonth YYYY') as month_label,
        COUNT(o.id)::int as total_orders,
        COALESCE(SUM(o.total_amount), 0)::numeric as total_sale,
        COALESCE(SUM(o.total_paid), 0)::numeric as total_collected,
        COALESCE(SUM(o.balance_due), 0)::numeric as pending_balance,
        COALESCE(SUM(item_counts.suits_qty), 0)::int as total_suits
      FROM orders o
      LEFT JOIN (
        SELECT order_id, SUM(quantity) as suits_qty
        FROM order_items
        GROUP BY order_id
      ) item_counts ON item_counts.order_id = o.id
      WHERE o.status != 'Cancelled'
      ${hasShopFilter ? "AND o.shop_id = $1" : ""}
      GROUP BY DATE_TRUNC('month', o.booking_date)
      ORDER BY DATE_TRUNC('month', o.booking_date) DESC
    `;

    // 2. User-wise (Staff / Admin) Sales & Cash Collection Breakdown
    const userSalesQuery = `
      SELECT
        COALESCE(o.created_by, 'Master Anas (Owner / Admin)') as user_name,
        COUNT(o.id)::int as orders_booked,
        COALESCE(SUM(o.total_amount), 0)::numeric as total_sale_booked,
        COALESCE(SUM(o.total_paid), 0)::numeric as order_payments_received,
        COALESCE(SUM(o.balance_due), 0)::numeric as pending_from_orders
      FROM orders o
      WHERE o.status != 'Cancelled'
      ${hasShopFilter ? "AND o.shop_id = $1" : ""}
      GROUP BY COALESCE(o.created_by, 'Master Anas (Owner / Admin)')
      ORDER BY total_sale_booked DESC
    `;

    const userLedgerCashQuery = `
      SELECT
        COALESCE(pl.created_by, 'Master Anas (Owner / Admin)') as user_name,
        COALESCE(SUM(pl.amount), 0)::numeric as total_cash_collected,
        COUNT(pl.id)::int as payment_transactions
      FROM payments_ledger pl
      WHERE pl.entry_type IN ('ADVANCE_PAYMENT', 'DELIVERY_PAYMENT', 'UDHAAR_RECOVERY', 'CREDIT_DEPOSIT')
      ${hasShopFilter ? "AND pl.shop_id = $1" : ""}
      GROUP BY COALESCE(pl.created_by, 'Master Anas (Owner / Admin)')
      ORDER BY total_cash_collected DESC
    `;

    // 3. Garment Type Sales Breakdown
    const garmentSalesQuery = `
      SELECT
        oi.garment_name,
        SUM(oi.quantity)::int as total_qty,
        SUM(oi.total_price)::numeric as total_revenue,
        ROUND(AVG(oi.unit_price), 0)::numeric as avg_rate
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'Cancelled'
      ${hasShopFilter ? "AND o.shop_id = $1" : ""}
      GROUP BY oi.garment_name
      ORDER BY total_revenue DESC
    `;

    // 4. Complete Audit Logs & Rate History
    const auditQuery = `
      SELECT * FROM audit_logs
      ORDER BY created_at DESC, id DESC
      LIMIT 100
    `;

    const rateHistoryQuery = `
      SELECT * FROM garment_rate_history
      ORDER BY changed_at DESC, id DESC
      LIMIT 100
    `;

    const [
      monthlyRes,
      userSalesRes,
      userCashRes,
      garmentSalesRes,
      auditRes,
      rateHistRes,
    ] = await Promise.all([
      pool.query(monthlyQuery, shopParams),
      pool.query(userSalesQuery, shopParams),
      pool.query(userLedgerCashQuery, shopParams),
      pool.query(garmentSalesQuery, shopParams),
      pool.query(auditQuery),
      pool.query(rateHistoryQuery),
    ]);

    return NextResponse.json({
      monthly_sales: monthlyRes.rows,
      user_sales: userSalesRes.rows,
      user_cash: userCashRes.rows,
      garment_sales: garmentSalesRes.rows,
      audit_logs: auditRes.rows,
      rate_history: rateHistRes.rows,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Database error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
