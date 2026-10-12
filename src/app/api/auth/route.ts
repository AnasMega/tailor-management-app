import { NextRequest, NextResponse } from "next/server";
import { pool, ensureDbInitialized } from "@/lib/db";
import { cookies } from "next/headers";

export async function GET() {
  try {
    await ensureDbInitialized();
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("tailor_session")?.value;

    const usersRes = await pool.query(`
      SELECT u.id, u.username, u.full_name, u.role, u.shop_id, u.phone, u.created_at, s.name as shop_name
      FROM users u
      LEFT JOIN shops s ON u.shop_id = s.id
      ORDER BY u.id ASC
    `);

    if (!sessionCookie) {
      return NextResponse.json({
        authenticated: false,
        user: null,
        users: usersRes.rows,
      });
    }

    let parsedUser = null;
    try {
      parsedUser = JSON.parse(Buffer.from(sessionCookie, "base64").toString("utf-8"));
    } catch {
      parsedUser = null;
    }

    if (!parsedUser?.id) {
      return NextResponse.json({
        authenticated: false,
        user: null,
        users: usersRes.rows,
      });
    }

    const userRes = await pool.query(
      `SELECT u.id, u.username, u.full_name, u.role, u.shop_id, u.phone, s.name as shop_name
       FROM users u
       LEFT JOIN shops s ON u.shop_id = s.id
       WHERE u.id = $1`,
      [parsedUser.id]
    );

    if (userRes.rows.length === 0) {
      return NextResponse.json({
        authenticated: false,
        user: null,
        users: usersRes.rows,
      });
    }

    return NextResponse.json({
      authenticated: true,
      user: userRes.rows[0],
      users: usersRes.rows,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Database error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDbInitialized();
    const body = await req.json();
    const { action } = body;

    if (action === "login") {
      const { username, password } = body;
      const res = await pool.query(
        `SELECT u.id, u.username, u.full_name, u.role, u.shop_id, u.phone, s.name as shop_name
         FROM users u
         LEFT JOIN shops s ON u.shop_id = s.id
         WHERE LOWER(u.username) = LOWER($1) AND u.password = $2`,
        [username?.trim(), password]
      );

      if (res.rows.length === 0) {
        return NextResponse.json(
          { error: "Invalid username or password!" },
          { status: 401 }
        );
      }

      const user = res.rows[0];
      const token = Buffer.from(JSON.stringify({ id: user.id, username: user.username })).toString("base64");

      const cookieStore = await cookies();
      cookieStore.set("tailor_session", token, {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });

      return NextResponse.json({ success: true, user });
    }

    if (action === "logout") {
      const cookieStore = await cookies();
      cookieStore.delete("tailor_session");
      return NextResponse.json({ success: true });
    }

    if (action === "change_password") {
      const { userId, newUsername, newPassword, fullName, phone, shopId, role } = body;
      if (!userId || !newUsername || !newPassword) {
        return NextResponse.json(
          { error: "Username and new password are required." },
          { status: 400 }
        );
      }

      const updateRes = await pool.query(
        `UPDATE users
         SET username = $1,
             password = $2,
             full_name = COALESCE($3, full_name),
             phone = COALESCE($4, phone),
             shop_id = COALESCE($5, shop_id),
             role = COALESCE($6, role)
         WHERE id = $7
         RETURNING id, username, full_name, role, shop_id, phone`,
        [newUsername.trim(), newPassword, fullName, phone, shopId || null, role || "admin", userId]
      );

      return NextResponse.json({
        success: true,
        user: updateRes.rows[0],
        message: "User credentials updated successfully!",
      });
    }

    if (action === "create_user") {
      const { username, password, fullName, role, shopId, phone } = body;
      if (!username || !password || !fullName) {
        return NextResponse.json(
          { error: "Username, Password, and Full Name are required." },
          { status: 400 }
        );
      }

      const insertRes = await pool.query(
        `INSERT INTO users (username, password, full_name, role, shop_id, phone)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, username, full_name, role, shop_id, phone`,
        [username.trim(), password, fullName.trim(), role || "manager", shopId || null, phone || ""]
      );

      return NextResponse.json({
        success: true,
        user: insertRes.rows[0],
        message: "New user created successfully!",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
