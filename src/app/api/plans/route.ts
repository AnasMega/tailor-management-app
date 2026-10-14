import { NextRequest, NextResponse } from "next/server";
import { pool, ensureDbInitialized } from "@/lib/db";

export async function GET() {
  try {
    await ensureDbInitialized();
    const res = await pool.query(`
      SELECT p.*,
        (SELECT COUNT(*) FROM users u WHERE u.plan_id = p.id) as subscriber_count
      FROM pricing_plans p
      WHERE p.is_active = true
      ORDER BY p.price_monthly ASC
    `);
    return NextResponse.json({ plans: res.rows });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Database error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDbInitialized();
    const body = await req.json();
    const {
      id,
      action,
      plan_name,
      price_monthly,
      storage_limit_mb,
      customizations_per_month,
      free_installation,
      continuity_guarantee,
      badge_text,
      is_popular,
      features,
    } = body;

    if (action === "delete") {
      if (!id) {
        return NextResponse.json({ error: "Plan ID is required" }, { status: 400 });
      }
      await pool.query("UPDATE pricing_plans SET is_active = false WHERE id = $1", [id]);
      return NextResponse.json({ success: true, message: "Plan removed successfully" });
    }

    if (id) {
      // Update plan
      const updateRes = await pool.query(
        `UPDATE pricing_plans
         SET plan_name = COALESCE($1, plan_name),
             price_monthly = COALESCE($2, price_monthly),
             storage_limit_mb = COALESCE($3, storage_limit_mb),
             customizations_per_month = COALESCE($4, customizations_per_month),
             free_installation = COALESCE($5, free_installation),
             continuity_guarantee = COALESCE($6, continuity_guarantee),
             badge_text = COALESCE($7, badge_text),
             is_popular = COALESCE($8, is_popular),
             features = COALESCE($9, features)
         WHERE id = $10
         RETURNING *`,
        [
          plan_name,
          price_monthly,
          storage_limit_mb,
          customizations_per_month,
          free_installation,
          continuity_guarantee,
          badge_text,
          is_popular,
          features ? JSON.stringify(features) : null,
          id,
        ]
      );

      // Sync plan_name and storage_limit_mb on users using this plan
      if (plan_name || storage_limit_mb) {
        await pool.query(
          `UPDATE users
           SET plan_name = $1,
               storage_limit_mb = $2
           WHERE plan_id = $3`,
          [plan_name, storage_limit_mb, id]
        );
      }

      return NextResponse.json({
        success: true,
        plan: updateRes.rows[0],
        message: "Pricing plan updated successfully!",
      });
    } else {
      // Create new plan
      if (!plan_name || price_monthly === undefined) {
        return NextResponse.json(
          { error: "Plan name and monthly price are required" },
          { status: 400 }
        );
      }

      const insertRes = await pool.query(
        `INSERT INTO pricing_plans
         (plan_name, price_monthly, storage_limit_mb, customizations_per_month, free_installation, continuity_guarantee, badge_text, is_popular, features)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          plan_name.trim(),
          Number(price_monthly),
          Number(storage_limit_mb || 500),
          Number(customizations_per_month || 0),
          free_installation ?? true,
          continuity_guarantee ?? true,
          badge_text || "",
          Boolean(is_popular),
          JSON.stringify(features || []),
        ]
      );

      return NextResponse.json({
        success: true,
        plan: insertRes.rows[0],
        message: "New pricing plan created successfully!",
      });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
