import { NextRequest } from "next/server";
import { pool } from "./db";

export interface AuthSession {
  id: number;
  username: string;
  role: string;
  shop_id: number | null;
  full_name?: string;
}

export async function getAuthSession(req?: NextRequest): Promise<AuthSession | null> {
  try {
    let sessionCookie: string | undefined;

    if (req) {
      sessionCookie = req.cookies.get("tailor_session")?.value;
    } else {
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      sessionCookie = cookieStore.get("tailor_session")?.value;
    }

    if (!sessionCookie) return null;

    let parsed: { id: number; username: string } | null = null;
    try {
      parsed = JSON.parse(Buffer.from(sessionCookie, "base64").toString("utf-8"));
    } catch {
      return null;
    }

    if (!parsed?.id) return null;

    const res = await pool.query(
      `SELECT id, username, full_name, role, shop_id
       FROM users
       WHERE id = $1`,
      [parsed.id]
    );

    if (res.rows.length === 0) return null;

    return {
      id: res.rows[0].id,
      username: res.rows[0].username,
      role: res.rows[0].role,
      shop_id: res.rows[0].shop_id ? Number(res.rows[0].shop_id) : null,
      full_name: res.rows[0].full_name,
    };
  } catch (err) {
    console.error("Auth session check error:", err);
    return null;
  }
}
