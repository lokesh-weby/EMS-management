import { prisma } from './lib/prisma.js';

async function seedAdminUser() {
  console.log("🌱 Seeding Admin User into PostgreSQL...");

  const adminData = {
    id: "b1840e1b-a934-48f9-a91c-0ec9a7c289e6",
    firebase_uid: "lWykxNiJkvTE7UjKjZBTzcYI0bF2",
    full_name: "Mr. Lokesh S",
    email: "lokesh0212004@gmail.com",
    phone: "",
    role: "admin",
    status: "active",
    created_at: new Date("2026-08-16T11:37:00.699Z"),
    updated_at: new Date("2026-08-16T11:37:00.699Z")
  };

  try {
    // Upsert into users table using SQL to handle schema constraints cleanly
    await prisma.$executeRawUnsafe(
      `INSERT INTO users (id, firebase_uid, full_name, email, phone, role, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6::"Role", $7::"Status", $8, $9)
       ON CONFLICT (email) DO UPDATE SET
         id = EXCLUDED.id,
         firebase_uid = EXCLUDED.firebase_uid,
         full_name = EXCLUDED.full_name,
         phone = EXCLUDED.phone,
         role = 'admin'::"Role",
         status = 'active'::"Status",
         updated_at = NOW()`,
      adminData.id,
      adminData.firebase_uid,
      adminData.full_name,
      adminData.email,
      adminData.phone,
      adminData.role,
      adminData.status,
      adminData.created_at,
      adminData.updated_at
    );

    console.log(`✅ Admin user seeded successfully: ${adminData.email} (Role: admin)`);

    // Verify row in database
    const users = await prisma.$queryRawUnsafe(
      `SELECT id, firebase_uid, full_name, email, role, status FROM users WHERE LOWER(email) = LOWER($1)`,
      adminData.email
    );

    console.log("📌 Seeded Admin Record in Database:", users[0]);
  } catch (error) {
    console.error("❌ Error seeding admin user:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdminUser();
