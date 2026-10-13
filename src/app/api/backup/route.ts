import { NextResponse } from "next/server";
import { pool, ensureDbInitialized } from "@/lib/db";

export async function GET() {
  try {
    await ensureDbInitialized();

    const tables = [
      "shops",
      "users",
      "garment_types",
      "garment_rate_history",
      "customers",
      "customer_measurements",
      "orders",
      "order_items",
      "payments_ledger",
      "audit_logs",
      "order_complaints",
    ];

    let sqlDump = `-- ==========================================================\n`;
    sqlDump += `-- ROYAL TAILORS ERP - LIVE DATABASE BACKUP\n`;
    sqlDump += `-- Generated: ${new Date().toISOString()}\n`;
    sqlDump += `-- PostgreSQL Version Target: 14+ / Cloud Neon / Localhost\n`;
    sqlDump += `-- ==========================================================\n\n`;
    sqlDump += `SET statement_timeout = 0;\n`;
    sqlDump += `SET client_encoding = 'UTF8';\n`;
    sqlDump += `SET standard_conforming_strings = on;\n\n`;

    for (const table of tables) {
      const res = await pool.query(`SELECT * FROM ${table} ORDER BY id ASC`);
      sqlDump += `-- ----------------------------------------------------------\n`;
      sqlDump += `-- Table: ${table} (${res.rows.length} records)\n`;
      sqlDump += `-- ----------------------------------------------------------\n`;

      if (res.rows.length === 0) {
        sqlDump += `-- (Table is currently empty)\n\n`;
        continue;
      }

      for (const row of res.rows) {
        const columns = Object.keys(row);
        const values = columns.map((col) => {
          const val = row[col];
          if (val === null || val === undefined) return "NULL";
          if (typeof val === "number" || typeof val === "boolean")
            return String(val);
          if (val instanceof Date) return `'${val.toISOString()}'`;
          if (typeof val === "object") {
            const jsonStr = JSON.stringify(val).replace(/'/g, "''");
            return `'${jsonStr}'::jsonb`;
          }
          const str = String(val).replace(/'/g, "''");
          return `'${str}'`;
        });

        sqlDump += `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${values.join(", ")}) ON CONFLICT (id) DO NOTHING;\n`;
      }
      sqlDump += `\n`;
    }

    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, 19);
    const fileName = `royal_tailor_backup_${timestamp}.sql`;

    return new NextResponse(sqlDump, {
      status: 200,
      headers: {
        "Content-Type": "application/sql; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Backup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
