import { NextRequest, NextResponse } from "next/server";
import { pool, ensureDbInitialized } from "@/lib/db";

export async function GET() {
  try {
    await ensureDbInitialized();
    const [garmentsRes, historyRes] = await Promise.all([
      pool.query(`SELECT * FROM garment_types ORDER BY id ASC`),
      pool.query(
        `SELECT * FROM garment_rate_history ORDER BY changed_at DESC, id DESC LIMIT 100`
      ),
    ]);
    return NextResponse.json({
      garments: garmentsRes.rows,
      rate_history: historyRes.rows,
    });
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
      id,
      name,
      category,
      base_price,
      urgent_surcharge,
      effective_month,
      notes,
      changed_by,
      measurement_fields,
      is_active,
    } = body;

    if (!name || base_price === undefined) {
      return NextResponse.json(
        { error: "Garment Name and Stitching Rate (Base Price) are required." },
        { status: 400 }
      );
    }

    const defaultFieldsByCategory: Record<string, string[]> = {
      Eastern: [
        "kameez_length",
        "tera",
        "bazu",
        "chest",
        "waist",
        "ghera",
        "collar",
        "shalwar_length",
        "paincha",
      ],
      Western: [
        "shirt_length",
        "tera",
        "bazu",
        "chest",
        "waist",
        "collar",
        "pant_length",
        "pant_waist",
        "hip",
        "thigh",
        "bottom",
      ],
      Formal: [
        "coat_length",
        "tera",
        "bazu",
        "chest",
        "waist",
        "hip",
        "collar",
      ],
      Kids: [
        "kameez_length",
        "tera",
        "bazu",
        "chest",
        "waist",
        "ghera",
        "collar",
        "shalwar_length",
        "paincha",
      ],
    };

    const fieldsToSave =
      measurement_fields &&
      Array.isArray(measurement_fields) &&
      measurement_fields.length > 0
        ? measurement_fields
        : defaultFieldsByCategory[category || "Eastern"] ||
          defaultFieldsByCategory.Eastern;

    const currentMonthLabel =
      effective_month?.trim() ||
      new Date().toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });

    await client.query("BEGIN");

    if (id) {
      const oldRes = await client.query(
        "SELECT * FROM garment_types WHERE id = $1",
        [id]
      );
      const oldRow = oldRes.rows[0];

      const updateRes = await client.query(
        `UPDATE garment_types
         SET name = $1,
             category = $2,
             base_price = $3,
             urgent_surcharge = $4,
             effective_month = $5,
             measurement_fields = $6::jsonb,
             is_active = $7,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $8
         RETURNING *`,
        [
          name.trim(),
          category || "Eastern",
          Number(base_price) || 0,
          Number(urgent_surcharge) || 500,
          currentMonthLabel,
          JSON.stringify(fieldsToSave),
          is_active ?? true,
          id,
        ]
      );
      const updated = updateRes.rows[0];

      // Log into garment_rate_history
      await client.query(
        `INSERT INTO garment_rate_history (
          garment_type_id, garment_name, category, old_price, new_price,
          old_urgent_surcharge, new_urgent_surcharge, effective_month, changed_by, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          updated.id,
          updated.name,
          updated.category,
          oldRow ? Number(oldRow.base_price) : Number(base_price),
          Number(base_price),
          oldRow ? Number(oldRow.urgent_surcharge) : Number(urgent_surcharge),
          Number(urgent_surcharge),
          currentMonthLabel,
          changed_by || "Master Anas (Owner / Admin)",
          notes || `Rate updated for ${currentMonthLabel}`,
        ]
      );

      // Log into audit_logs
      await client.query(
        `INSERT INTO audit_logs (entity_type, entity_ref, action_title, details, performed_by)
         VALUES ('RATE_CARD', $1, 'Stitching Rate Updated', $2, $3)`,
        [
          updated.name,
          `${updated.name} rate changed from Rs. ${
            oldRow ? Number(oldRow.base_price).toLocaleString() : "—"
          } to Rs. ${Number(base_price).toLocaleString()} (Effective: ${currentMonthLabel})`,
          changed_by || "Master Anas (Owner / Admin)",
        ]
      );

      await client.query("COMMIT");
      return NextResponse.json({ garment: updated });
    } else {
      const insertRes = await client.query(
        `INSERT INTO garment_types (
          name, category, base_price, urgent_surcharge, effective_month, measurement_fields, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, true)
         RETURNING *`,
        [
          name.trim(),
          category || "Eastern",
          Number(base_price) || 0,
          Number(urgent_surcharge) || 500,
          currentMonthLabel,
          JSON.stringify(fieldsToSave),
        ]
      );
      const created = insertRes.rows[0];

      await client.query(
        `INSERT INTO garment_rate_history (
          garment_type_id, garment_name, category, old_price, new_price,
          old_urgent_surcharge, new_urgent_surcharge, effective_month, changed_by, notes
        ) VALUES ($1, $2, $3, NULL, $4, NULL, $5, $6, $7, $8)`,
        [
          created.id,
          created.name,
          created.category,
          Number(base_price),
          Number(urgent_surcharge),
          currentMonthLabel,
          changed_by || "Master Anas (Owner / Admin)",
          notes || `Initial rate set for ${currentMonthLabel}`,
        ]
      );

      await client.query(
        `INSERT INTO audit_logs (entity_type, entity_ref, action_title, details, performed_by)
         VALUES ('RATE_CARD', $1, 'New Garment Rate Added', $2, $3)`,
        [
          created.name,
          `Added "${created.name}" at Rs. ${Number(base_price).toLocaleString()} (${currentMonthLabel})`,
          changed_by || "Master Anas (Owner / Admin)",
        ]
      );

      await client.query("COMMIT");
      return NextResponse.json({ garment: created });
    }
  } catch (error: unknown) {
    await client.query("ROLLBACK").catch(() => {});
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    client.release();
  }
}
