import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testCascadeDelete() {
  console.log("--- STARTING CASCADE DELETE TEST ---");
  try {
    // 1. Create a test user with unique email and firebaseUid
    const testUser = await prisma.user.create({
      data: {
        firebaseUid: `fb_cascade_${Date.now()}`,
        fullName: "Cascade Test User",
        email: `test_cascade_${Date.now()}@example.com`,
        role: "admin",
        status: "active"
      }
    });
    console.log("Created test user ID:", testUser.id);

    // 2. Create test event
    const testEvent = await prisma.event.create({
      data: {
        title: "Test Cascade Event",
        description: "Test description for cascade deletion",
        venue: "Main Hall",
        eventDate: "2026-10-10",
        startTime: "10:00 AM",
        endTime: "04:00 PM",
        registrationDeadline: "2026-10-09",
        createdById: testUser.id,
        status: "draft"
      }
    });
    console.log("Created test event ID:", testEvent.id);

    // 3. Create test organizer
    const testOrganizer = await prisma.eventOrganizer.create({
      data: {
        eventId: testEvent.id,
        name: "Test Organizer",
        department: "CSE",
        email: "organizer@example.com",
        phone: "1234567890"
      }
    });
    console.log("Created test organizer ID:", testOrganizer.id);

    // 4. Create test registration
    const testRegistration = await prisma.registration.create({
      data: {
        eventId: testEvent.id,
        leaderName: "Test Leader",
        leaderDept: "CSE",
        leaderEmail: "leader@example.com",
        leaderPhone: "9876543210",
        status: "pending"
      }
    });
    console.log("Created test registration ID:", testRegistration.id);

    // 5. Create test registration member
    const testMember = await prisma.registrationMember.create({
      data: {
        registrationId: testRegistration.id,
        name: "Test Member 1",
        department: "ECE",
        email: "member1@example.com",
        phone: "5555555555"
      }
    });
    console.log("Created test registration member ID:", testMember.id);

    // Verify all exist before deletion
    const preCheckEvent = await prisma.event.findUnique({ where: { id: testEvent.id } });
    const preCheckOrgs = await prisma.eventOrganizer.findMany({ where: { eventId: testEvent.id } });
    const preCheckRegs = await prisma.registration.findMany({ where: { eventId: testEvent.id } });
    const preCheckMembers = await prisma.registrationMember.findMany({ where: { registrationId: testRegistration.id } });
    
    console.log("\n--- PRE-DELETE CHECKS ---");
    console.log({
      eventExists: !!preCheckEvent,
      orgsCount: preCheckOrgs.length,
      regsCount: preCheckRegs.length,
      membersCount: preCheckMembers.length
    });

    // 6. Delete Event using Prisma Client `delete` method as specified in Requirement 7
    console.log("\n--> Executing: await prisma.event.delete({ where: { id: testEvent.id } })");
    await prisma.event.delete({
      where: { id: testEvent.id }
    });
    console.log("Event deletion command completed successfully.");

    // 7. Verify cascade deletions
    const postCheckEvent = await prisma.event.findUnique({ where: { id: testEvent.id } });
    const postCheckOrgs = await prisma.eventOrganizer.findMany({ where: { eventId: testEvent.id } });
    const postCheckRegs = await prisma.registration.findMany({ where: { eventId: testEvent.id } });
    const postCheckMembers = await prisma.registrationMember.findMany({ where: { registrationId: testRegistration.id } });
    const postCheckUser = await prisma.user.findUnique({ where: { id: testUser.id } });

    console.log("\n--- POST-DELETE VERIFICATION ---");
    console.log({
      eventDeleted: !postCheckEvent,
      orgsDeleted: postCheckOrgs.length === 0,
      regsDeleted: postCheckRegs.length === 0,
      membersDeleted: postCheckMembers.length === 0,
      userStillExists: !!postCheckUser
    });

    // Clean up test user
    await prisma.user.delete({ where: { id: testUser.id } });
    console.log("Cleaned up test user.");

    if (!postCheckEvent && postCheckOrgs.length === 0 && postCheckRegs.length === 0 && postCheckMembers.length === 0 && postCheckUser) {
      console.log("\n✅ CASCADE DELETE VERIFICATION PASSED PERFECTLY!");
    } else {
      console.error("\n❌ CASCADE DELETE VERIFICATION FAILED!");
      process.exit(1);
    }

  } catch (err) {
    console.error("Test Error:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testCascadeDelete();
