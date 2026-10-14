import { Pool } from "pg";

const globalForPg = global as unknown as { pgPool: Pool };

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_jVBItKRrd05W@ep-rapid-snow-b4yaot5j-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const isLocalDb =
  connectionString.includes("localhost") ||
  connectionString.includes("127.0.0.1");

export const pool =
  globalForPg.pgPool ||
  new Pool({
    connectionString,
    ssl: isLocalDb ? false : { rejectUnauthorized: false },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPg.pgPool = pool;
}

let isInitialized = false;

export async function ensureDbInitialized() {
  if (isInitialized) return;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Shops Table (Multi-branch support with active/inactive & delete)
    await client.query(`
      CREATE TABLE IF NOT EXISTS shops (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        branch_code VARCHAR(50) NOT NULL,
        phone VARCHAR(50),
        whatsapp VARCHAR(50),
        address TEXT,
        receipt_footer TEXT DEFAULT 'Shukriya! Delivery ke waqt yeh Parchi zaroor saath layein.',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Users Table (Login & Staff Management)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(150) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        shop_id INTEGER REFERENCES shops(id) ON DELETE SET NULL,
        phone VARCHAR(50),
        subscription_status VARCHAR(50) DEFAULT 'active',
        subscription_start_date DATE DEFAULT CURRENT_DATE,
        subscription_end_date DATE DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
        plan_id INTEGER,
        plan_name VARCHAR(150) DEFAULT 'Basic Starter Plan',
        storage_limit_mb INTEGER DEFAULT 500,
        storage_used_mb NUMERIC(10, 2) DEFAULT 4.5,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'active',
      ADD COLUMN IF NOT EXISTS subscription_start_date DATE DEFAULT CURRENT_DATE,
      ADD COLUMN IF NOT EXISTS subscription_end_date DATE DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
      ADD COLUMN IF NOT EXISTS plan_id INTEGER,
      ADD COLUMN IF NOT EXISTS plan_name VARCHAR(150) DEFAULT 'Basic Starter Plan',
      ADD COLUMN IF NOT EXISTS storage_limit_mb INTEGER DEFAULT 500,
      ADD COLUMN IF NOT EXISTS storage_used_mb NUMERIC(10, 2) DEFAULT 4.5;
    `);

    // 2B. Pricing & Subscription Plans Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS pricing_plans (
        id SERIAL PRIMARY KEY,
        plan_name VARCHAR(150) NOT NULL,
        price_monthly NUMERIC(10, 2) NOT NULL,
        storage_limit_mb INTEGER NOT NULL DEFAULT 500,
        customizations_per_month INTEGER NOT NULL DEFAULT 0,
        free_installation BOOLEAN DEFAULT TRUE,
        continuity_guarantee BOOLEAN DEFAULT TRUE,
        features JSONB NOT NULL DEFAULT '[]'::jsonb,
        is_popular BOOLEAN DEFAULT FALSE,
        badge_text VARCHAR(100) DEFAULT '',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Garment Types & Stitching Rate Card Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS garment_types (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        category VARCHAR(50) NOT NULL,
        base_price NUMERIC(10, 2) NOT NULL,
        urgent_surcharge NUMERIC(10, 2) DEFAULT 500,
        effective_month VARCHAR(100) DEFAULT 'Current Standard Rate',
        measurement_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
        is_active BOOLEAN DEFAULT TRUE,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      ALTER TABLE garment_types
      ADD COLUMN IF NOT EXISTS effective_month VARCHAR(100) DEFAULT 'Current Standard Rate';
    `);

    // 3B. Garment Rate History Table (Separate Pricing Entity & Rate Change Log)
    await client.query(`
      CREATE TABLE IF NOT EXISTS garment_rate_history (
        id SERIAL PRIMARY KEY,
        garment_type_id INTEGER REFERENCES garment_types(id) ON DELETE CASCADE,
        garment_name VARCHAR(150) NOT NULL,
        category VARCHAR(50),
        old_price NUMERIC(10, 2),
        new_price NUMERIC(10, 2) NOT NULL,
        old_urgent_surcharge NUMERIC(10, 2),
        new_urgent_surcharge NUMERIC(10, 2) NOT NULL,
        effective_month VARCHAR(100) NOT NULL,
        changed_by VARCHAR(150) DEFAULT 'Admin',
        notes TEXT,
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Customers Table (with Udhaar / Credit Balance tracking)
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        customer_code VARCHAR(50) UNIQUE NOT NULL,
        full_name VARCHAR(150) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        whatsapp VARCHAR(50),
        address TEXT,
        shop_id INTEGER REFERENCES shops(id) ON DELETE SET NULL,
        notes TEXT,
        opening_balance NUMERIC(12, 2) DEFAULT 0,
        current_balance NUMERIC(12, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Customer Measurements (Naap Book) Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS customer_measurements (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        category VARCHAR(50) NOT NULL,
        label VARCHAR(100) DEFAULT 'Standard Fit',
        measurements JSONB NOT NULL DEFAULT '{}'::jsonb,
        style_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(customer_id, category)
      );
    `);

    // 6. Orders Table (Order Booking & Parchi)
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        customer_id INTEGER REFERENCES customers(id) ON DELETE RESTRICT,
        shop_id INTEGER REFERENCES shops(id) ON DELETE SET NULL,
        booking_date DATE DEFAULT CURRENT_DATE,
        trial_date DATE,
        delivery_date DATE NOT NULL,
        delivered_at TIMESTAMP,
        status VARCHAR(50) DEFAULT 'Booked',
        is_urgent BOOLEAN DEFAULT FALSE,
        subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
        discount NUMERIC(12, 2) NOT NULL DEFAULT 0,
        urgent_charges NUMERIC(12, 2) NOT NULL DEFAULT 0,
        total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
        advance_paid NUMERIC(12, 2) NOT NULL DEFAULT 0,
        total_paid NUMERIC(12, 2) NOT NULL DEFAULT 0,
        balance_due NUMERIC(12, 2) NOT NULL DEFAULT 0,
        master_tailor VARCHAR(100),
        created_by VARCHAR(150) DEFAULT 'Master Anas (Owner / Admin)',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS created_by VARCHAR(150) DEFAULT 'Master Anas (Owner / Admin)';
    `);

    // 7. Order Items Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        garment_type_id INTEGER REFERENCES garment_types(id) ON DELETE SET NULL,
        garment_name VARCHAR(150) NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price NUMERIC(10, 2) NOT NULL,
        total_price NUMERIC(12, 2) NOT NULL,
        fabric_details VARCHAR(255),
        measurement_snapshot JSONB DEFAULT '{}'::jsonb,
        stitching_notes TEXT
      );
    `);

    // 8. Payments & Udhaar Khata Ledger Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments_ledger (
        id SERIAL PRIMARY KEY,
        receipt_number VARCHAR(50) UNIQUE NOT NULL,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
        shop_id INTEGER REFERENCES shops(id) ON DELETE SET NULL,
        entry_type VARCHAR(50) NOT NULL,
        amount NUMERIC(12, 2) NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'Cash',
        created_by VARCHAR(150) DEFAULT 'Master Anas (Owner / Admin)',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      ALTER TABLE payments_ledger
      ADD COLUMN IF NOT EXISTS created_by VARCHAR(150) DEFAULT 'Master Anas (Owner / Admin)';
    `);

    // 9. Complete System Audit & Activity History Logs Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        entity_type VARCHAR(50) NOT NULL,
        entity_ref VARCHAR(100),
        action_title VARCHAR(150) NOT NULL,
        details TEXT,
        performed_by VARCHAR(150) DEFAULT 'Master Anas (Owner / Admin)',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 10. Post-Delivery Order Complaints, Alterations, Tailor Faults & Returns Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_complaints (
        id SERIAL PRIMARY KEY,
        complaint_number VARCHAR(50) UNIQUE NOT NULL,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        order_number VARCHAR(50) NOT NULL,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        shop_id INTEGER REFERENCES shops(id) ON DELETE SET NULL,
        complaint_type VARCHAR(100) NOT NULL,
        fault_tags JSONB DEFAULT '[]'::jsonb,
        issue_description TEXT NOT NULL,
        financial_action VARCHAR(50) DEFAULT 'NO_CHARGE',
        extra_charge_to_customer NUMERIC(12, 2) DEFAULT 0,
        customer_paid_now NUMERIC(12, 2) DEFAULT 0,
        paid_to_customer_refund NUMERIC(12, 2) DEFAULT 0,
        bill_reduction_amount NUMERIC(12, 2) DEFAULT 0,
        payment_method VARCHAR(50) DEFAULT 'Cash',
        new_delivery_date DATE,
        assigned_karigar VARCHAR(100),
        updated_measurements JSONB DEFAULT '{}'::jsonb,
        status VARCHAR(50) DEFAULT 'In Alteration',
        created_by VARCHAR(150) DEFAULT 'Master Anas (Owner / Admin)',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP
      );
    `);

    await client.query(`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS has_complaint BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS complaint_count INTEGER DEFAULT 0;
    `);

    // Seed default Shop if empty
    const shopCountRes = await client.query("SELECT COUNT(*) FROM shops");
    if (parseInt(shopCountRes.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO shops (name, branch_code, phone, whatsapp, address, receipt_footer, is_active)
        VALUES ('Royal Tailors Main Branch', 'MAIN-01', '0300-1234567', '0300-1234567', 'Shop #12, Commercial Market, Saddar', 'Shukriya! Delivery ke waqt yeh Parchi zaroor saath layein.', true);
      `);
    }

    // Seed default User (Admin) if empty
    const userCountRes = await client.query("SELECT COUNT(*) FROM users");
    if (parseInt(userCountRes.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO users (username, password, full_name, role, phone)
        VALUES ('admin', 'admin123', 'Master Anas (Owner / Admin)', 'admin', '0300-1234567');
      `);
    }

    // Seed default Garment Types if empty
    const garmentCountRes = await client.query("SELECT COUNT(*) FROM garment_types");
    if (parseInt(garmentCountRes.rows[0].count, 10) === 0) {
      const easternFields = JSON.stringify([
        "kameez_length", "tera", "bazu", "chest", "waist", "ghera", "collar", "shalwar_length", "paincha"
      ]);
      const westernFields = JSON.stringify([
        "shirt_length", "tera", "bazu", "chest", "waist", "collar", "pant_length", "pant_waist", "hip", "thigh", "bottom"
      ]);
      const formalFields = JSON.stringify([
        "coat_length", "tera", "bazu", "chest", "waist", "hip", "collar"
      ]);

      await client.query(`
        INSERT INTO garment_types (name, category, base_price, urgent_surcharge, effective_month, measurement_fields, is_active)
        VALUES
          ('Shalwar Kameez (Simple Silai)', 'Eastern', 1800, 500, 'October 2026', '${easternFields}'::jsonb, true),
          ('Shalwar Kameez (Double Silai / Chamak)', 'Eastern', 2200, 600, 'October 2026', '${easternFields}'::jsonb, true),
          ('Kurta Pajama (Formal)', 'Eastern', 1700, 400, 'October 2026', '${easternFields}'::jsonb, true),
          ('Dress Shirt', 'Western', 1400, 400, 'October 2026', '${westernFields}'::jsonb, true),
          ('Dress Trouser / Pant', 'Western', 1600, 400, 'October 2026', '${westernFields}'::jsonb, true),
          ('Pant Shirt (Complete Pair)', 'Western', 3000, 800, 'October 2026', '${westernFields}'::jsonb, true),
          ('Safari Suit', 'Formal', 3200, 800, 'October 2026', '${formalFields}'::jsonb, true),
          ('Waistcoat (Waskat Bespoke)', 'Formal', 3500, 1000, 'October 2026', '${formalFields}'::jsonb, true),
          ('Kids Shalwar Kameez', 'Kids', 1300, 300, 'October 2026', '${easternFields}'::jsonb, true);
      `);
    }

    // Seed initial Rate History & Historical Orders if garment_rate_history is empty
    const rateHistCountRes = await client.query(
      "SELECT COUNT(*) FROM garment_rate_history"
    );
    if (parseInt(rateHistCountRes.rows[0].count, 10) === 0) {
      const gTypes = await client.query("SELECT id, name, category, base_price, urgent_surcharge FROM garment_types ORDER BY id ASC");
      if (gTypes.rows.length > 0) {
        for (const gt of gTypes.rows.slice(0, 4)) {
          await client.query(`
            INSERT INTO garment_rate_history (
              garment_type_id, garment_name, category, old_price, new_price,
              old_urgent_surcharge, new_urgent_surcharge, effective_month, changed_by, notes, changed_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'October 2026', 'Master Anas (Owner / Admin)', 'Standard season silai rate', CURRENT_TIMESTAMP - INTERVAL '15 days')
          `, [
            gt.id,
            gt.name,
            gt.category,
            Math.max(0, Number(gt.base_price) - 200),
            Number(gt.base_price),
            Math.max(0, Number(gt.urgent_surcharge) - 100),
            Number(gt.urgent_surcharge),
          ]);
        }
      }

      // Also seed a previous month order (September 2026) so Monthly Sale vs Purani Sale report has multi-month data out of the box
      const prevOrdCheck = await client.query(
        "SELECT COUNT(*) FROM orders WHERE order_number = 'ORD-0998'"
      );
      if (parseInt(prevOrdCheck.rows[0].count, 10) === 0) {
        const custCheck = await client.query("SELECT id, shop_id FROM customers ORDER BY id ASC LIMIT 2");
        if (custCheck.rows.length > 0) {
          const cFirst = custCheck.rows[0].id;
          const sFirst = custCheck.rows[0].shop_id || 1;
          const prevOrd = await client.query(
            `
            INSERT INTO orders (
              order_number, customer_id, shop_id, booking_date, trial_date, delivery_date, delivered_at,
              status, is_urgent, subtotal, discount, urgent_charges, total_amount,
              advance_paid, total_paid, balance_due, master_tailor, created_by, notes, created_at
            ) VALUES (
              'ORD-0998', $1, $2, CURRENT_DATE - INTERVAL '35 days', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE - INTERVAL '28 days', CURRENT_TIMESTAMP - INTERVAL '28 days',
              'Delivered', false, 7200, 200, 0, 7000, 3000, 7000, 0, 'Ustad Rasheed', 'Ustad Rasheed (Head Cutter)', 'Previous Month (Purani Sale) - 4 Suits Family Order', CURRENT_TIMESTAMP - INTERVAL '35 days'
            ) RETURNING id;
          `,
            [cFirst, sFirst]
          );

          await client.query(
            `
            INSERT INTO order_items (order_id, garment_type_id, garment_name, quantity, unit_price, total_price, fabric_details, stitching_notes)
            VALUES ($1, 1, 'Shalwar Kameez (Simple Silai)', 4, 1800, 7200, '4x Assorted Cotton Suits', 'Delivered last month');
          `,
            [prevOrd.rows[0].id]
          );

          await client.query(
            `
            INSERT INTO payments_ledger (receipt_number, customer_id, order_id, shop_id, entry_type, amount, payment_method, created_by, description, created_at)
            VALUES
              ('PAY-0998-A', $1, $2, $3, 'ORDER_BILL', 7000, 'System', 'Ustad Rasheed (Head Cutter)', 'Previous Month Order #ORD-0998 Bill', CURRENT_TIMESTAMP - INTERVAL '35 days'),
              ('PAY-0998-B', $1, $2, $3, 'DELIVERY_PAYMENT', 7000, 'Cash', 'Ustad Rasheed (Head Cutter)', 'Full payment received for Order #ORD-0998', CURRENT_TIMESTAMP - INTERVAL '28 days');
          `,
            [cFirst, prevOrd.rows[0].id, sFirst]
          );
        }
      }

      // Seed initial Audit Logs
      await client.query(`
        INSERT INTO audit_logs (entity_type, entity_ref, action_title, details, performed_by, created_at)
        VALUES
          ('RATE_CARD', 'Shalwar Kameez', 'Monthly Stitching Rate Updated', 'Shalwar Kameez (Simple Silai) rate updated from Rs. 1,600 to Rs. 1,800 for October 2026', 'Master Anas (Owner / Admin)', CURRENT_TIMESTAMP - INTERVAL '15 days'),
          ('CUSTOMER', 'CUST-1001', 'Customer & Naap Created', 'Haji Muhammad Tariq registered with Eastern Shalwar Kameez Naap (Lambai 41, Tera 18.5, Chest 42)', 'Master Anas (Owner / Admin)', CURRENT_TIMESTAMP - INTERVAL '5 days'),
          ('ORDER', 'ORD-1001', 'New Order Parchi Booked', 'Order #ORD-1001 booked for Haji Muhammad Tariq — Bill Rs. 3,600, Advance Rs. 2,000', 'Master Anas (Owner / Admin)', CURRENT_TIMESTAMP - INTERVAL '3 days'),
          ('ORDER', 'ORD-1002', 'Order Marked Ready for Delivery', 'Order #ORD-1002 (Kamran Ahmed Khan) marked Ready by Master Nadeem', 'Ustad Rasheed (Head Cutter)', CURRENT_TIMESTAMP - INTERVAL '1 day');
      `);
    }

    await client.query("COMMIT");
    isInitialized = true;
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Database initialization error:", err);
    throw err;
  } finally {
    client.release();
  }
}
