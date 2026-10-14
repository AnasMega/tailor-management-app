const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_jVBItKRrd05W@ep-rapid-snow-b4yaot5j-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log('Creating pricing_plans table and updating users schema...');

  await pool.query(`
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

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS plan_id INTEGER REFERENCES pricing_plans(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS plan_name VARCHAR(150) DEFAULT 'Starter Continuity Plan',
    ADD COLUMN IF NOT EXISTS storage_limit_mb INTEGER DEFAULT 500,
    ADD COLUMN IF NOT EXISTS storage_used_mb NUMERIC(10, 2) DEFAULT 4.5;
  `);

  // Check if plans exist, if not seed the 6 plans
  const countRes = await pool.query('SELECT COUNT(*) FROM pricing_plans');
  if (parseInt(countRes.rows[0].count, 10) === 0) {
    const plans = [
      {
        plan_name: 'Basic Starter Plan',
        price_monthly: 500,
        storage_limit_mb: 500,
        customizations_per_month: 0,
        free_installation: true,
        continuity_guarantee: true,
        badge_text: 'Entry Level',
        is_popular: false,
        features: JSON.stringify([
          '1 Dedicated Tailor Company & Admin Account',
          '500 MB Monthly Cloud DB Storage',
          'Free Setup & Live Database Installation',
          'Smooth Continuity & Daily 1-Click Backup',
          'Digital Naap Book, Parchi Printing & Udhaar Khata'
        ])
      },
      {
        plan_name: 'Standard Pro Plan',
        price_monthly: 1000,
        storage_limit_mb: 1024,
        customizations_per_month: 1,
        free_installation: true,
        continuity_guarantee: true,
        badge_text: 'Popular Choice',
        is_popular: true,
        features: JSON.stringify([
          '1 Dedicated Tailor Company & Admin Account',
          '1 GB (1,024 MB) Cloud Database Storage',
          '1 Free Monthly Customization / Feature Request',
          'Free Setup & Priority Installation',
          'Smooth Continuity & Automated Expiry Management',
          'Full Reports, Customer WhatsApp & Karigar Tracking'
        ])
      },
      {
        plan_name: 'Business Growth Plan',
        price_monthly: 1500,
        storage_limit_mb: 1536,
        customizations_per_month: 2,
        free_installation: true,
        continuity_guarantee: true,
        badge_text: 'Best Value',
        is_popular: false,
        features: JSON.stringify([
          '1 Dedicated Tailor Company & Admin Account',
          '1.5 GB Cloud Database Storage',
          '2 Monthly Customizations Included',
          'Free Installation & VIP Assistance',
          'Smooth Continuity & 99.9% Uptime Guarantee',
          'Multi-Karigar Assignment & Order Workflow'
        ])
      },
      {
        plan_name: 'Executive Master Plan',
        price_monthly: 2000,
        storage_limit_mb: 2048,
        customizations_per_month: 3,
        free_installation: true,
        continuity_guarantee: true,
        badge_text: 'High Volume',
        is_popular: false,
        features: JSON.stringify([
          '1 Dedicated Tailor Company & Admin Account',
          '2 GB Cloud Database Storage',
          '3 Monthly Customizations / Design Updates',
          'Free Professional Installation & Staff Walkthrough',
          'Smooth Continuity Guarantee with Instant Backups',
          'Full Financial Analytics, Udhaar Recovery & Ledger'
        ])
      },
      {
        plan_name: 'Premium Studio Plan',
        price_monthly: 3500,
        storage_limit_mb: 3500,
        customizations_per_month: 4,
        free_installation: true,
        continuity_guarantee: true,
        badge_text: 'Studio Grade',
        is_popular: false,
        features: JSON.stringify([
          '1 Dedicated Tailor Company & Admin Account',
          '3.5 GB High-Speed Database Storage',
          '4 Monthly Customizations / Tailored Features',
          'Free Setup, Onboarding & White-Glove Support',
          'Uninterrupted Smooth Continuity Guarantee',
          'Full Branch Security, Audio Parchi & Advanced Reports'
        ])
      },
      {
        plan_name: 'Enterprise VIP Plan',
        price_monthly: 5000,
        storage_limit_mb: 5120,
        customizations_per_month: 6,
        free_installation: true,
        continuity_guarantee: true,
        badge_text: 'Ultimate VIP',
        is_popular: false,
        features: JSON.stringify([
          '1 Dedicated Tailor Company & Admin Account',
          '5 GB (5,120 MB) Maximum Cloud Storage',
          '6 Monthly Customizations / Direct Developer Support',
          'Free Instant Installation & Priority Hotline Support',
          'Rock-Solid Smooth Continuity & Zero Downtime Assurance',
          'Unlimited Orders, VIP Reports & Custom Branding'
        ])
      }
    ];

    for (const p of plans) {
      await pool.query(
        `INSERT INTO pricing_plans 
         (plan_name, price_monthly, storage_limit_mb, customizations_per_month, free_installation, continuity_guarantee, badge_text, is_popular, features)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [p.plan_name, p.price_monthly, p.storage_limit_mb, p.customizations_per_month, p.free_installation, p.continuity_guarantee, p.badge_text, p.is_popular, p.features]
      );
    }
    console.log('6 pricing plans inserted.');
  }

  // Update users to have initial plan (assign Plan 1 or 2 by default)
  const defaultPlanRes = await pool.query('SELECT id, plan_name, storage_limit_mb FROM pricing_plans ORDER BY price_monthly ASC LIMIT 1');
  if (defaultPlanRes.rows.length > 0) {
    const defaultPlan = defaultPlanRes.rows[0];
    await pool.query(
      `UPDATE users 
       SET plan_id = COALESCE(plan_id, $1),
           plan_name = COALESCE(plan_name, $2),
           storage_limit_mb = COALESCE(storage_limit_mb, $3)
       WHERE role != 'superadmin'`,
      [defaultPlan.id, defaultPlan.plan_name, defaultPlan.storage_limit_mb]
    );

    // Super admin gets unlimited
    await pool.query(
      `UPDATE users 
       SET plan_name = 'Super Admin Unlimited Master',
           storage_limit_mb = 10000,
           storage_used_mb = 9.1
       WHERE role = 'superadmin'`
    );
  }

  const allPlans = await pool.query('SELECT id, plan_name, price_monthly, storage_limit_mb, customizations_per_month, badge_text FROM pricing_plans ORDER BY price_monthly ASC');
  console.log('Live Pricing Plans:');
  console.table(allPlans.rows);

  await pool.end();
}

main().catch(console.error);
