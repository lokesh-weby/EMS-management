import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testUserDeletion() {
  console.log("--- STARTING SINGLE USER DELETION TEST ---");
  try {
    // 1. Create a test user
    const testUser = await prisma.user.create({
      data: {
        firebaseUid: `fb_test_del_${Date.now()}`,
        fullName: "User Deletion Test",
        email: `test_user_del_${Date.now()}@example.com`,
        role: "coordinator",
        status: "active"
      }
    });
    console.log("Created test user:", testUser.id);

    // Verify user exists in database
    let foundUser = await prisma.user.findUnique({ where: { id: testUser.id } });
    console.log("Pre-delete user check: User exists =", !!foundUser);

    // 2. Perform deletion via Prisma (mirroring DELETE /api/users/:id logic)
    console.log("\nDeleting user via prisma.user.delete...");
    await prisma.user.delete({
      where: { id: testUser.id }
    });

    // 3. Verify user is removed from database
    foundUser = await prisma.user.findUnique({ where: { id: testUser.id } });
    console.log("Post-delete user check: User exists =", !!foundUser);

    if (!foundUser) {
      console.log("\n✅ SINGLE USER DELETION VERIFICATION PASSED!");
    } else {
      console.error("\n❌ SINGLE USER DELETION FAILED!");
      process.exit(1);
    }
  } catch (err) {
    console.error("User Deletion Test Error:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testUserDeletion();
