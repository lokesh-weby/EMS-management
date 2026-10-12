import { prisma } from './lib/prisma.js';
import { randomUUID } from 'crypto';

async function seedMockEvents() {
  console.log("🌱 Seeding Mock Events across multiple departments...");

  try {
    // 1. Get or create an admin/coordinator user for created_by relation
    let user = await prisma.users.findFirst();
    if (!user) {
      user = await prisma.users.create({
        data: {
          id: `user-admin-seed-${Date.now()}`,
          full_name: 'SRM Fest Admin',
          email: 'admin@srmist.edu.in',
          phone: '+91 9876543210',
          role: 'admin',
          status: 'active',
          updated_at: new Date()
        }
      });
      console.log("Created seed admin user:", user.email);
    }

    const createdById = user.id;

    // 2. Define rich mock events dataset
    const mockEvents = [
      {
        id: `ev-ai-hack-${Date.now()}-1`,
        title: "AI Genesis: 36-Hour National Generative AI Hackathon",
        description: "Build cutting-edge GenAI applications, LLM agents, and multimodal AI solutions. Compete for ₹1,50,000 in cash prizes with mentorship from industry leaders.",
        department: "Computational Intelligence",
        eventScope: "National",
        eventType: "Hackathon",
        bannerUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80",
        eventDate: "2026-09-18",
        startTime: "09:00 AM",
        endTime: "09:00 PM",
        registrationDeadline: "2026-09-15",
        venue: "Tech Park 4th Floor Innovation Lab",
        registrationFee: 500,
        maxTeamSize: 4,
        whatsappGroupLink: "https://chat.whatsapp.com/genai-hackathon-2026",
        upiId: "srmfest2026@upi",
        accountHolderName: "SRM IST Tech Fest",
        upiQrUrl: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=srmfest2026@upi&pn=SRM%20Tech%20Fest",
        status: "published",
        createdById: createdById,
        organizers: [
          {
            name: "Dr. Aris Thorne",
            department: "Computational Intelligence",
            email: "aris.thorne@srmist.edu.in",
            phone: "+91 9876500111",
            registerNumber: "FAC-CI-101"
          },
          {
            name: "Rahul Verma",
            department: "Computer Science & Engineering",
            email: "rahul.v@srmist.edu.in",
            phone: "+91 9876500112",
            registerNumber: "RA2311003010045"
          }
        ]
      },
      {
        id: `ev-robowars-${Date.now()}-2`,
        title: "RoboWars 2026: Heavyweight Combat & Autonomous Arena",
        description: "Witness 15kg & 30kg combat bots clash in the bulletproof arena, plus autonomous line-follower and maze solver competitions.",
        department: "Mechatronics Engineering",
        eventScope: "National",
        eventType: "Competition",
        bannerUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80",
        eventDate: "2026-09-19",
        startTime: "10:00 AM",
        endTime: "06:00 PM",
        registrationDeadline: "2026-09-16",
        venue: "Outdoor Mechanical Quadrangle Arena",
        registrationFee: 600,
        maxTeamSize: 5,
        whatsappGroupLink: "https://chat.whatsapp.com/robowars-2026",
        upiId: "srmrobowars@upi",
        accountHolderName: "Robotics Club SRM",
        upiQrUrl: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=srmrobowars@upi&pn=RoboWars",
        status: "published",
        createdById: createdById,
        organizers: [
          {
            name: "Prof. Vikram Malhotra",
            department: "Mechatronics Engineering",
            email: "vikram.m@srmist.edu.in",
            phone: "+91 9876500221",
            registerNumber: "FAC-MCT-204"
          }
        ]
      },
      {
        id: `ev-cultural-${Date.now()}-3`,
        title: "Symphony of Lights: National Inter-College Dance & Music Night",
        description: "Battle of the Bands, Group Western & Classical Dance showcases under stage concert lighting. Top 3 teams perform at the Grand Finale.",
        department: "Visual Communication",
        eventScope: "National",
        eventType: "Competition",
        bannerUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80",
        eventDate: "2026-09-20",
        startTime: "05:00 PM",
        endTime: "10:00 PM",
        registrationDeadline: "2026-09-17",
        venue: "TP Ganesan Main Auditorium",
        registrationFee: 400,
        maxTeamSize: 8,
        whatsappGroupLink: "https://chat.whatsapp.com/symphony-cultural-2026",
        upiId: "srmcultural@upi",
        accountHolderName: "SRM Cultural Association",
        upiQrUrl: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=srmcultural@upi&pn=CulturalFest",
        status: "published",
        createdById: createdById,
        organizers: [
          {
            name: "Ananya Deshmukh",
            department: "Visual Communication",
            email: "ananya.d@srmist.edu.in",
            phone: "+91 9876500331",
            registerNumber: "RA2311008010099"
          }
        ]
      },
      {
        id: `ev-esports-${Date.now()}-4`,
        title: "Valorant & BGMI National eSports Arena Championship",
        description: "High-octane LAN tournament featuring custom lobbies, broadcast live on YouTube & Twitch. ₹1,00,000 prize pool.",
        department: "Computer Applications",
        eventScope: "National",
        eventType: "Competition",
        bannerUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80",
        eventDate: "2026-09-18",
        startTime: "11:00 AM",
        endTime: "08:00 PM",
        registrationDeadline: "2026-09-16",
        venue: "Hi-Tech Seminar Hall 2",
        registrationFee: 350,
        maxTeamSize: 5,
        whatsappGroupLink: "https://chat.whatsapp.com/esports-arena-2026",
        upiId: "srmesports@upi",
        accountHolderName: "SRM Gaming Club",
        upiQrUrl: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=srmesports@upi&pn=GamingArena",
        status: "published",
        createdById: createdById,
        organizers: [
          {
            name: "Karan Patel",
            department: "Computer Applications",
            email: "karan.p@srmist.edu.in",
            phone: "+91 9876500441",
            registerNumber: "RA2311012010012"
          }
        ]
      },
      {
        id: `ev-venture-${Date.now()}-5`,
        title: "VentureVault 2026: Startup Pitching & Angel Investor Deck",
        description: "Pitch your startup idea to real VCs and angel investors. On-spot seed funding opportunities up to ₹5,00,000 for top 2 innovations.",
        department: "Management",
        eventScope: "National",
        eventType: "Symposium",
        bannerUrl: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80",
        eventDate: "2026-09-19",
        startTime: "09:30 AM",
        endTime: "04:30 PM",
        registrationDeadline: "2026-09-15",
        venue: "School of Management Conference Center",
        registrationFee: 250,
        maxTeamSize: 3,
        whatsappGroupLink: "https://chat.whatsapp.com/venturevault-2026",
        upiId: "srmincubation@upi",
        accountHolderName: "SRM Startup Incubation Cell",
        upiQrUrl: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=srmincubation@upi&pn=VentureVault",
        status: "published",
        createdById: createdById,
        organizers: [
          {
            name: "Priya Sundaram",
            department: "Management",
            email: "priya.s@srmist.edu.in",
            phone: "+91 9876500551",
            registerNumber: "FAC-MBA-302"
          }
        ]
      },
      {
        id: `ev-drone-${Date.now()}-6`,
        title: "AeroWings 2026: FPV Drone Racing & Obstacle Course",
        description: "High-speed FPV pilot racing through LED gates and autonomous payload drop precision challenge. ₹80,000 prize pool.",
        department: "Aerospace Engineering",
        eventScope: "National",
        eventType: "Competition",
        bannerUrl: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=1200&q=80",
        eventDate: "2026-09-20",
        startTime: "08:30 AM",
        endTime: "03:30 PM",
        registrationDeadline: "2026-09-17",
        venue: "SRM Sports Ground Flying Zone",
        registrationFee: 450,
        maxTeamSize: 3,
        whatsappGroupLink: "https://chat.whatsapp.com/aerowings-2026",
        upiId: "srmaeroclub@upi",
        accountHolderName: "Aero Club SRM",
        upiQrUrl: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=srmaeroclub@upi&pn=AeroWings",
        status: "published",
        createdById: createdById,
        organizers: [
          {
            name: "Dr. K. Nambiar",
            department: "Aerospace Engineering",
            email: "nambiar.k@srmist.edu.in",
            phone: "+91 9876500661",
            registerNumber: "FAC-AERO-108"
          }
        ]
      },
      {
        id: `ev-uiux-${Date.now()}-7`,
        title: "DesignSprint 2026: 24-Hour UI/UX & Product Designathon",
        description: "Solve real-world design briefs in Figma, prototype interactive mobile/web interfaces, and present to lead product designers from tech giants.",
        department: "Journalism And Mass Communication",
        eventScope: "National",
        eventType: "Hackathon",
        bannerUrl: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80",
        eventDate: "2026-09-18",
        startTime: "10:00 AM",
        endTime: "10:00 AM",
        registrationDeadline: "2026-09-15",
        venue: "Media Lab 3rd Floor",
        registrationFee: 200,
        maxTeamSize: 2,
        whatsappGroupLink: "https://chat.whatsapp.com/designsprint-2026",
        upiId: "srmdesign@upi",
        accountHolderName: "SRM Design Society",
        upiQrUrl: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=srmdesign@upi&pn=DesignSprint",
        status: "published",
        createdById: createdById,
        organizers: [
          {
            name: "Meera Nair",
            department: "Journalism And Mass Communication",
            email: "meera.n@srmist.edu.in",
            phone: "+91 9876500771",
            registerNumber: "RA2311018010055"
          }
        ]
      },
      {
        id: `ev-biotech-${Date.now()}-8`,
        title: "BioGene 2026: CRISPR & MedTech Poster & Prototype Expo",
        description: "Present research posters, healthcare prototypes, and synthetic biology projects to esteemed scientists and pharma leaders.",
        department: "Biotechnology",
        eventScope: "National",
        eventType: "Exhibition",
        bannerUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1200&q=80",
        eventDate: "2026-09-19",
        startTime: "09:00 AM",
        endTime: "04:00 PM",
        registrationDeadline: "2026-09-16",
        venue: "BioTech Block Seminar Hall 1",
        registrationFee: 150,
        maxTeamSize: 4,
        whatsappGroupLink: "https://chat.whatsapp.com/biogene-2026",
        upiId: "srmbiotech@upi",
        accountHolderName: "SRM BioTech Association",
        upiQrUrl: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=srmbiotech@upi&pn=BioGene",
        status: "published",
        createdById: createdById,
        organizers: [
          {
            name: "Dr. S. Ramakrishnan",
            department: "Biotechnology",
            email: "ramakrishnan.s@srmist.edu.in",
            phone: "+91 9876500881",
            registerNumber: "FAC-BIO-209"
          }
        ]
      }
    ];

    // 3. Upsert events into database
    for (const item of mockEvents) {
      const { organizers, ...eventData } = item;

      // Upsert event row via Prisma raw query
      await prisma.$executeRawUnsafe(
        `INSERT INTO events (
           id, title, description, department, event_scope, event_type,
           banner_url, event_date, start_time, end_time, registration_deadline,
           venue, registration_fee, max_team_size, whatsapp_group_link,
           upi_id, account_holder_name, upi_qr_url, status, created_by,
           created_at, updated_at
         )
         VALUES (
           $1, $2, $3, $4, $5, $6,
           $7, $8, $9, $10, $11,
           $12, $13, $14, $15,
           $16, $17, $18, $19::"EventStatus", $20,
           NOW(), NOW()
         )
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           description = EXCLUDED.description,
           department = EXCLUDED.department,
           event_scope = EXCLUDED.event_scope,
           event_type = EXCLUDED.event_type,
           banner_url = EXCLUDED.banner_url,
           event_date = EXCLUDED.event_date,
           start_time = EXCLUDED.start_time,
           end_time = EXCLUDED.end_time,
           registration_deadline = EXCLUDED.registration_deadline,
           venue = EXCLUDED.venue,
           registration_fee = EXCLUDED.registration_fee,
           max_team_size = EXCLUDED.max_team_size,
           whatsapp_group_link = EXCLUDED.whatsapp_group_link,
           upi_id = EXCLUDED.upi_id,
           account_holder_name = EXCLUDED.account_holder_name,
           upi_qr_url = EXCLUDED.upi_qr_url,
           status = EXCLUDED.status,
           updated_at = NOW()`,
        eventData.id,
        eventData.title,
        eventData.description,
        eventData.department,
        eventData.eventScope,
        eventData.eventType,
        eventData.bannerUrl,
        eventData.eventDate,
        eventData.startTime,
        eventData.endTime,
        eventData.registrationDeadline,
        eventData.venue,
        eventData.registrationFee,
        eventData.maxTeamSize,
        eventData.whatsappGroupLink,
        eventData.upiId,
        eventData.accountHolderName,
        eventData.upiQrUrl,
        eventData.status,
        eventData.createdById
      );

      // Insert event organizers
      if (Array.isArray(organizers)) {
        for (const org of organizers) {
          await prisma.$executeRawUnsafe(
            `INSERT INTO event_organizers (id, event_id, name, department, email, phone, register_number)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (id) DO NOTHING`,
            `org-${randomUUID()}`,
            eventData.id,
            org.name,
            org.department,
            org.email,
            org.phone,
            org.registerNumber || null
          );
        }
      }

      console.log(`✅ Upserted event: ${eventData.title}`);
    }

    console.log("🎉 All 8 mock events successfully seeded into PostgreSQL database!");
  } catch (err) {
    console.error("❌ Seed Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

seedMockEvents();
