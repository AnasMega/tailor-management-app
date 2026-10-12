import { NextRequest, NextResponse } from "next/server";
import { pool, ensureDbInitialized } from "@/lib/db";

export async function GET() {
  try {
    await ensureDbInitialized();
    const res = await pool.query(`
      SELECT s.*,
        (SELECT COUNT(*) FROM orders o WHERE o.shop_id = s.id) as total_orders,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders o WHERE o.shop_id = s.id AND o.status != 'Cancelled') as total_revenue,
        (SELECT COUNT(*) FROM customers c WHERE c.shop_id = s.id) as total_customers
      FROM shops s
      ORDER BY s.is_active DESC, s.id ASC
    `);
    return NextResponse.json({ shops: res.rows });
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
      action,
      id,
      name,
      branch_code,
      phone,
      whatsapp,
      address,
      receipt_footer,
      is_active,
      performed_by,
    } = body;

    if (action === "toggle_active") {
      if (!id) {
        return NextResponse.json({ error: "Shop ID is required" }, { status: 400 });
      }
      // Ensure at least 1 active shop remains if deactivating
      if (is_active === false) {
        const activeCountRes = await client.query(
          "SELECT COUNT(*) FROM shops WHERE is_active = true AND id != $1",
          [id]
        );
        if (parseInt(activeCountRes.rows[0].count, 10) === 0) {
          return NextResponse.json(
            {
              error:
                "Kam az kam 1 Shop Branch active rehna zaroori hai! Pehle doosri branch ko active karein.",
            },
            { status: 400 }
          );
        }
      }

      const toggleRes = await client.query(
        `UPDATE shops SET is_active = $1 WHERE id = $2 RETURNING *`,
        [Boolean(is_active), id]
      );
      const shop = toggleRes.rows[0];

      await client.query(
        `INSERT INTO audit_logs (entity_type, entity_ref, action_title, details, performed_by)
         VALUES ('SHOP', $1, $2, $3, $4)`,
        [
          shop.branch_code,
          shop.is_active ? "Shop Branch Activated" : "Shop Branch Deactivated",
          `Shop "${shop.name}" (${shop.branch_code}) marked as ${
            shop.is_active ? "Active" : "Inactive"
          }`,
          performed_by || "Admin",
        ]
      );

      return NextResponse.json({ shop });
    }

    if (action === "delete") {
      if (!id) {
        return NextResponse.json({ error: "Shop ID is required" }, { status: 400 });
      }

      const allShopsRes = await client.query(
        "SELECT id, name, branch_code FROM shops WHERE id != $1 ORDER BY is_active DESC, id ASC",
        [id]
      );
      if (allShopsRes.rows.length === 0) {
        return NextResponse.json(
          {
            error:
              "Aakhri (Last) Shop Branch delete nahi ho sakti kyunke system mein kam az kam 1 shop hona zaroori hai.",
          },
          { status: 400 }
        );
      }

      const fallbackShopId = allShopsRes.rows[0].id;
      const targetShopRes = await client.query("SELECT * FROM shops WHERE id = $1", [id]);
      const targetShop = targetShopRes.rows[0];

      await client.query("BEGIN");
      // Reassign any customers, orders, ledger entries, users to the primary remaining shop
      await client.query("UPDATE customers SET shop_id = $1 WHERE shop_id = $2", [
        fallbackShopId,
        id,
      ]);
      await client.query("UPDATE orders SET shop_id = $1 WHERE shop_id = $2", [
        fallbackShopId,
        id,
      ]);
      await client.query(
        "UPDATE payments_ledger SET shop_id = $1 WHERE shop_id = $2",
        [fallbackShopId, id]
      );
      await client.query("UPDATE users SET shop_id = $1 WHERE shop_id = $2", [
        fallbackShopId,
        id,
      ]);
      await client.query("DELETE FROM shops WHERE id = $1", [id]);

      if (targetShop) {
        await client.query(
          `INSERT INTO audit_logs (entity_type, entity_ref, action_title, details, performed_by)
           VALUES ('SHOP', $1, 'Shop Branch Deleted', $2, $3)`,
          [
            targetShop.branch_code,
            `Shop "${targetShop.name}" deleted; associated records moved to Shop ID #${fallbackShopId}`,
            performed_by || "Admin",
          ]
        );
      }

      await client.query("COMMIT");
      return NextResponse.json({ success: true, fallbackShopId });
    }

    if (!name || !branch_code) {
      return NextResponse.json(
        { error: "Shop Name and Branch Code are required." },
        { status: 400 }
      );
    }

    if (id) {
      const updateRes = await client.query(
        `UPDATE shops
         SET name = $1,
             branch_code = $2,
             phone = $3,
             whatsapp = $4,
             address = $5,
             receipt_footer = $6,
             is_active = $7
         WHERE id = $8
         RETURNING *`,
        [
          name.trim(),
          branch_code.trim(),
          phone || "",
          whatsapp || "",
          address || "",
          receipt_footer ||
            "Shukriya! Delivery ke waqt yeh Parchi zaroor saath layein.",
          is_active ?? true,
          id,
        ]
      );

      await client.query(
        `INSERT INTO audit_logs (entity_type, entity_ref, action_title, details, performed_by)
         VALUES ('SHOP', $1, 'Shop Details Updated', $2, $3)`,
        [
          branch_code.trim(),
          `Shop "${name.trim()}" details updated`,
          performed_by || "Admin",
        ]
      );

      return NextResponse.json({ shop: updateRes.rows[0] });
    } else {
      const insertRes = await client.query(
        `INSERT INTO shops (name, branch_code, phone, whatsapp, address, receipt_footer, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, true)
         RETURNING *`,
        [
          name.trim(),
          branch_code.trim(),
          phone || "",
          whatsapp || "",
          address || "",
          receipt_footer ||
            "Shukriya! Delivery ke waqt yeh Parchi zaroor saath layein.",
        ]
      );

      await client.query(
        `INSERT INTO audit_logs (entity_type, entity_ref, action_title, details, performed_by)
         VALUES ('SHOP', $1, 'New Shop Branch Created', $2, $3)`,
        [
          branch_code.trim(),
          `New Shop Branch "${name.trim()}" (${branch_code.trim()}) added`,
          performed_by || "Admin",
        ]
      );

      return NextResponse.json({ shop: insertRes.rows[0] });
    }
  } catch (error: unknown) {
    await client.query("ROLLBACK").catch(() => {});
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    client.release();
  }
}
