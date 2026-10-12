import { Router } from 'express';
import crypto, { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import { prisma } from '../lib/prisma.js';
import { mapEventRow } from '../utils/formatters.js';
import { addEmailJob } from '../queues/email.queue.js';

const router = Router();

// 1. GET /api/public/events (Fetch Published Events with DB-side search, category, department filtering & pagination)
router.get('/events', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const search = req.query.search ? req.query.search.trim() : '';
    const department = req.query.department && req.query.department !== 'All' ? req.query.department.trim() : '';
    const scope = (req.query.scope || req.query.eventScope) && (req.query.scope !== 'All' && req.query.eventScope !== 'All') ? (req.query.scope || req.query.eventScope).trim() : '';
    const type = (req.query.type || req.query.eventType) && (req.query.type !== 'All' && req.query.eventType !== 'All') ? (req.query.type || req.query.eventType).trim() : '';

    let whereConditions = ["e.status = 'published'"];
    let params = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(e.title ILIKE $${paramIndex} OR e.venue ILIKE $${paramIndex} OR e.description ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (department) {
      whereConditions.push(`e.department = $${paramIndex}`);
      params.push(department);
      paramIndex++;
    }

    if (scope) {
      whereConditions.push(`e.event_scope = $${paramIndex}`);
      params.push(scope);
      paramIndex++;
    }

    if (type) {
      whereConditions.push(`e.event_type = $${paramIndex}`);
      params.push(type);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    const limitParamIdx = paramIndex;
    const offsetParamIdx = paramIndex + 1;
    const queryParams = [...params, limit, offset];

    const rawEvents = await prisma.$queryRawUnsafe(`
      SELECT e.*, 
        COALESCE(
          (SELECT json_agg(o.*) FROM event_organizers o WHERE o.event_id = e.id),
          '[]'::json
        ) as organizers
      FROM events e
      WHERE ${whereClause}
      ORDER BY e.created_at DESC
      LIMIT $${limitParamIdx} OFFSET $${offsetParamIdx}
    `, ...queryParams);

    const countResult = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*)::int as total FROM events e WHERE ${whereClause}
    `, ...params);

    const total = countResult[0]?.total || 0;
    const events = rawEvents.map(mapEventRow);

    return res.json({
      events,
      total,
      page,
      limit,
      hasMore: offset + events.length < total
    });
  } catch (err) {
    console.error('Public Events DB Fetch Error:', err);
    return res.status(500).json({ error: 'Failed to fetch public events' });
  }
});

// 2. GET /api/public/events/:id (Fetch Single Published Event)
router.get('/events/:id', async (req, res) => {
  try {
    const eventId = req.params.id;
    const rawEvents = await prisma.$queryRawUnsafe(`
      SELECT e.*, 
        COALESCE(
          (SELECT json_agg(o.*) FROM event_organizers o WHERE o.event_id = e.id),
          '[]'::json
        ) as organizers
      FROM events e
      WHERE e.id = $1
      LIMIT 1
    `, eventId);

    if (!rawEvents || rawEvents.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    return res.json(mapEventRow(rawEvents[0]));
  } catch (err) {
    console.error('Public Single Event Error:', err);
    return res.status(500).json({ error: 'Failed to fetch event details' });
  }
});

// 3. POST /api/public/registrations (Student Event Registration Submission)
router.post('/registrations', async (req, res) => {
  try {
    const payload = req.body;
    const regId = payload.id || `REG-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const regNumber = regId;

    // Verify Event exists in DB & is published
    const eventCheck = await prisma.$queryRawUnsafe(
      `SELECT id, status, title FROM events WHERE id = $1 LIMIT 1`,
      payload.eventId
    );
    if (!eventCheck || eventCheck.length === 0) {
      return res.status(404).json({
        error: 'Registration Failed: This event has been deleted and is no longer available in the database.'
      });
    }
    if (eventCheck[0].status !== 'published') {
      return res.status(400).json({
        error: 'Registration Failed: This event is currently unpublished or no longer accepting registrations.'
      });
    }

    // Insert Registration Record
    const teamSize = Array.isArray(payload.members) && payload.members.length > 0 ? payload.members.length : 1;
    const leaderDept = payload.leaderDept || payload.department || payload.college || 'General';

    await prisma.$executeRawUnsafe(
      `INSERT INTO registrations (
         id, event_id, team_leader_name, team_leader_email, team_leader_phone,
         department, payment_screenshot_url, status, created_at, updated_at
       )
       VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8::"RegistrationStatus", NOW(), NOW()
       )`,
      regId,
      payload.eventId,
      payload.leaderName || payload.teamLeaderName || 'Participant',
      payload.leaderEmail || payload.teamLeaderEmail || '',
      payload.leaderPhone || payload.teamLeaderPhone || '',
      leaderDept,
      payload.paymentScreenshot || payload.paymentScreenshotUrl || 'Free Event',
      'pending'
    );

    // Insert Team Members
    if (Array.isArray(payload.members) && payload.members.length > 0) {
      for (const m of payload.members) {
        if (m.name && m.name.trim()) {
          await prisma.$executeRawUnsafe(
            `INSERT INTO registration_members (id, registration_id, name, department, email, phone)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            m.id || randomUUID(),
            regId,
            m.name,
            m.department || leaderDept,
            m.email || '',
            m.phone || ''
          );
        }
      }
    }

    const createdReg = {
      id: regId,
      registrationNumber: regNumber,
      eventId: payload.eventId,
      teamName: payload.teamName || null,
      leaderName: payload.leaderName,
      leaderRegisterNum: payload.leaderRegisterNum,
      leaderDept: payload.leaderDept,
      leaderEmail: payload.leaderEmail,
      leaderPhone: payload.leaderPhone,
      paymentScreenshot: payload.paymentScreenshot || null,
      utrNumber: payload.utrNumber || null,
      status: 'pending',
      members: payload.members || []
    };

    // Queue Confirmation Email
    const targetEmail = payload.leaderEmail || payload.teamLeaderEmail;
    if (targetEmail) {
      const eventTitle = eventCheck[0]?.title || 'College Event';
      await addEmailJob({
        to: targetEmail,
        subject: `Registration Received - ${eventTitle}`,
        html: `
          <h3>Registration Received Successfully!</h3>
          <p>Dear ${payload.leaderName || 'Participant'},</p>
          <p>Thank you for registering for <strong>${eventTitle}</strong>.</p>
          <p>Your Registration Number is: <strong>${regNumber}</strong></p>
          <p>Your registration status is currently <strong>Pending Verification</strong>. You will receive an update once verified by the organizers.</p>
          <br/>
          <p>Best regards,<br/>EMS Team</p>
        `
      }).catch(err => console.warn('Public registration email queue error:', err));
    }

    return res.json(createdReg);
  } catch (err) {
    console.error('Public Registration Submission Error:', err);
    return res.status(400).json({ error: err.message || 'Registration failed' });
  }
});

// 4. GET /api/public/status/:query (Check Registration Status)
router.get('/status/:query', async (req, res) => {
  try {
    const rawQuery = req.params.query.trim().toLowerCase();
    const cleanIdPart = rawQuery.replace(/^reg-/, '');
    const likePattern = `%${cleanIdPart}%`;

    const rawRegs = await prisma.$queryRawUnsafe(`
      SELECT r.*, 
        COALESCE(
          (SELECT json_agg(m.*) FROM registration_members m WHERE m.registration_id = r.id),
          '[]'::json
        ) as members
      FROM registrations r
      WHERE LOWER(r.id) = $1
         OR LOWER(r.team_leader_email) = $1
         OR LOWER(r.team_leader_phone) = $1
         OR LOWER(r.id) LIKE $2
      ORDER BY r.created_at DESC
    `, rawQuery, likePattern);

    if (!rawRegs || rawRegs.length === 0) {
      return res.status(404).json({ error: 'No registrations found matching your query.' });
    }

    const regList = await Promise.all(rawRegs.map(async (r) => {
      const eventCheck = await prisma.$queryRawUnsafe(
        `SELECT title, event_date, venue, whatsapp_group_link, created_by FROM events WHERE id = $1 LIMIT 1`,
        r.event_id
      );

      let orgsCheck = await prisma.$queryRawUnsafe(
        `SELECT id, name, phone, email, department FROM event_organizers WHERE event_id = $1`,
        r.event_id
      );

      if (!orgsCheck || orgsCheck.length === 0) {
        const creatorCheck = await prisma.$queryRawUnsafe(
          `SELECT u.id, u.full_name as name, u.phone, u.email FROM events e JOIN users u ON e.created_by = u.id WHERE e.id = $1 LIMIT 1`,
          r.event_id
        );
        if (creatorCheck && creatorCheck.length > 0) {
          orgsCheck = creatorCheck.map(c => ({
            id: c.id,
            name: c.name,
            phone: c.phone || '',
            email: c.email || '',
            department: 'Event Coordinator'
          }));
        }
      }

      const primaryOrg = orgsCheck && orgsCheck.length > 0 ? orgsCheck[0] : null;

      return {
        id: r.id,
        registrationNumber: `REG-${(r.id || '').substring(0, 6).toUpperCase()}`,
        eventId: r.event_id,
        eventTitle: eventCheck[0]?.title || 'College Event',
        eventDate: eventCheck[0]?.event_date || '',
        venue: eventCheck[0]?.venue || '',
        whatsappGroupLink: eventCheck[0]?.whatsapp_group_link || null,
        organizerPhone: primaryOrg?.phone || '',
        organizerName: primaryOrg?.name || '',
        organizerEmail: primaryOrg?.email || '',
        organizerDepartment: primaryOrg?.department || '',
        coordinators: (orgsCheck || []).map(o => ({
          id: o.id,
          name: o.name,
          phone: o.phone,
          email: o.email,
          department: o.department
        })),
        organizers: (orgsCheck || []).map(o => ({
          id: o.id,
          name: o.name,
          phone: o.phone,
          email: o.email,
          department: o.department
        })),
        teamName: r.team_name || null,
        leaderName: r.team_leader_name || r.leader_name || 'Participant',
        leaderEmail: r.team_leader_email || r.leader_email || '',
        leaderPhone: r.team_leader_phone || r.leader_phone || '',
        status: r.status,
        rejectionReason: r.rejection_reason || r.remarks || '',
        members: r.members || []
      };
    }));

    return res.json(regList);
  } catch (err) {
    console.error('Public Status Check Error:', err);
    return res.status(500).json({ error: 'Failed to lookup registration status' });
  }
});

// 5. POST /api/public/upload (Signed Cloudinary Upload via API Secret)
router.post('/upload', async (req, res) => {
  try {
    const { imageBase64, folder = 'EMS' } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'No image base64 data provided' });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dlwsqsxzw';
    const apiKey = process.env.CLOUDINARY_API_KEY || '513997937779544';
    const apiSecret = process.env.CLOUDINARY_API_SECRET || '25MQNX4utZ9_vRWIdoHWnxKj_wM';

    if (cloudName && apiKey && apiSecret) {
      try {
        const timestamp = Math.floor(Date.now() / 1000);
        const strToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
        const signature = crypto.createHash('sha1').update(strToSign).digest('hex');

        const cloudinaryRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file: imageBase64,
            api_key: apiKey,
            timestamp: timestamp,
            folder: folder,
            signature: signature
          })
        });

        if (cloudinaryRes.ok) {
          const cloudData = await cloudinaryRes.json();
          if (cloudData.secure_url) {
            console.log(`✅ Signed Cloudinary Upload Success: ${cloudData.secure_url}`);
            return res.json({ url: cloudData.secure_url });
          }
        } else {
          const cloudErr = await cloudinaryRes.json().catch(() => ({}));
          console.warn('⚠️ Cloudinary API Signed Upload Error:', cloudErr);
        }
      } catch (cloudErr) {
        console.warn('⚠️ Cloudinary Signed Upload Fetch Exception:', cloudErr.message);
      }
    }

    // Local file fallback if Cloudinary credentials fail
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    const ext = matches ? matches[1].split('/')[1] || 'png' : 'png';
    const base64Data = matches ? matches[2] : imageBase64;
    const fileName = `upload_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}.${ext}`;
    const filePath = path.join(uploadsDir, fileName);

    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

    const fileUrl = `http://localhost:5000/uploads/${fileName}`;
    return res.json({ url: fileUrl });
  } catch (err) {
    console.error('Upload Endpoint Error:', err);
    return res.status(500).json({ error: 'Failed to upload image' });
  }
});

export default router;
