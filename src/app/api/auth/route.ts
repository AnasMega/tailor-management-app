import { NextRequest, NextResponse } from "next/server";
import { pool, ensureDbInitialized } from "@/lib/db";
import { cookies } from "next/headers";

export async function GET() {
  try {
    await ensureDbInitialized();
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("tailor_session")?.value;

    const usersRes = await pool.query(`
      SELECT u.id, u.username, u.password, u.full_name, u.role, u.shop_id, u.phone, u.created_at,
             u.subscription_status, u.subscription_start_date, u.subscription_end_date,
             s.name as shop_name, s.branch_code
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
      `SELECT u.id, u.username, u.full_name, u.role, u.shop_id, u.phone,
              u.subscription_status, u.subscription_start_date, u.subscription_end_date,
              s.name as shop_name, s.branch_code
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

    const user = userRes.rows[0];

    // Check subscription expiry for non-superadmin
    if (user.role !== "superadmin") {
      const isStatusInactive = user.subscription_status === "inactive" || user.subscription_status === "expired";
      const isPastExpiry = user.subscription_end_date && new Date(user.subscription_end_date) < new Date();
      if (isStatusInactive || isPastExpiry) {
        cookieStore.delete("tailor_session");
        return NextResponse.json({
          authenticated: false,
          user: null,
          subscription_expired: true,
          users: usersRes.rows,
          message: "Aapki subscription ki muddat khatam ho chuki hai. Mazeed use karne ke liye Owner / Super Admin se rabta karein:\n👤 Admin: Anas Hussain\n✉️ Email: anas.megatech@gmail.com",
        });
      }
    }

    return NextResponse.json({
      authenticated: true,
      user,
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
        `SELECT u.id, u.username, u.full_name, u.role, u.shop_id, u.phone,
                u.subscription_status, u.subscription_start_date, u.subscription_end_date,
                s.name as shop_name, s.branch_code
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

      // Check subscription expiry for non-superadmin
      if (user.role !== "superadmin") {
        const isStatusInactive = user.subscription_status === "inactive" || user.subscription_status === "expired";
        const isPastExpiry = user.subscription_end_date && new Date(user.subscription_end_date) < new Date();
        if (isStatusInactive || isPastExpiry) {
          return NextResponse.json(
            {
              error: "Aapki subscription ki muddat khatam ho chuki hai. Mazeed use karne ke liye Owner / Super Admin se rabta karein:\n👤 Admin: Anas Hussain\n✉️ Email: anas.megatech@gmail.com",
              subscription_expired: true,
              contact_email: "anas.megatech@gmail.com",
            },
            { status: 403 }
          );
        }
      }

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

    if (action === "update_subscription") {
      const { userId, subscriptionStatus, subscriptionStartDate, subscriptionEndDate } = body;
      if (!userId) {
        return NextResponse.json({ error: "User ID is required" }, { status: 400 });
      }

      const updateRes = await pool.query(
        `UPDATE users
         SET subscription_status = COALESCE($1, subscription_status),
             subscription_start_date = COALESCE($2, subscription_start_date),
             subscription_end_date = COALESCE($3, subscription_end_date)
         WHERE id = $4
         RETURNING id, username, full_name, role, shop_id, subscription_status, subscription_start_date, subscription_end_date`,
        [subscriptionStatus, subscriptionStartDate, subscriptionEndDate, userId]
      );

      return NextResponse.json({
        success: true,
        user: updateRes.rows[0],
        message: "User subscription updated successfully!",
      });
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
         RETURNING id, username, full_name, role, shop_id, phone, subscription_status, subscription_start_date, subscription_end_date`,
        [newUsername.trim(), newPassword, fullName, phone, shopId || null, role || "admin", userId]
      );

      return NextResponse.json({
        success: true,
        user: updateRes.rows[0],
        message: "User credentials updated successfully!",
      });
    }

    if (action === "create_user") {
      const { username, password, fullName, role, shopId, phone, subscriptionStatus, subscriptionStartDate, subscriptionEndDate } = body;
      if (!username || !password || !fullName) {
        return NextResponse.json(
          { error: "Username, Password, and Full Name are required." },
          { status: 400 }
        );
      }

      const insertRes = await pool.query(
        `INSERT INTO users (username, password, full_name, role, shop_id, phone, subscription_status, subscription_start_date, subscription_end_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, username, full_name, role, shop_id, phone, subscription_status, subscription_start_date, subscription_end_date`,
        [
          username.trim(),
          password,
          fullName.trim(),
          role || "admin",
          shopId || null,
          phone || "",
          subscriptionStatus || "active",
          subscriptionStartDate || new Date().toISOString().slice(0, 10),
          subscriptionEndDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        ]
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
