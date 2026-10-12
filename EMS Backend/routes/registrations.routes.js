import { Router } from 'express';
import { randomUUID } from 'crypto';
import { prisma } from '../lib/prisma.js';
import { sendEmail } from '../services/email.service.js';
import { addEmailJob } from '../queues/email.queue.js';

const router = Router();

// GET /api/registrations (Fetch Registrations matching public.registrations table schema)
router.get('/', async (req, res) => {
  try {
    const search = req.query.search ? req.query.search.trim() : '';
    const status = req.query.status && req.query.status !== 'all' && req.query.status !== 'All' ? req.query.status.trim() : '';

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(
        LOWER(r.team_leader_name) LIKE $${paramIndex} OR 
        LOWER(r.team_leader_email) LIKE $${paramIndex} OR 
        LOWER(r.team_leader_phone) LIKE $${paramIndex} OR 
        LOWER(r.department) LIKE $${paramIndex} OR
        LOWER(r.id) LIKE $${paramIndex}
      )`);
      params.push(`%${search.toLowerCase()}%`);
      paramIndex++;
    }

    if (status) {
      whereConditions.push(`LOWER(r.status::text) = LOWER($${paramIndex})`);
      params.push(status);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*)::int as total FROM registrations r ${whereClause}`;
    const countResult = await prisma.$queryRawUnsafe(countSql, ...params);
    const total = countResult[0]?.total || 0;

    const dataParams = [...params, limit, offset];
    const querySql = `
      SELECT r.*, e.title as event_title,
        COALESCE(
          (SELECT json_agg(m.*) FROM registration_members m WHERE m.registration_id = r.id),
          '[]'::json
        ) as members
      FROM registrations r
      LEFT JOIN events e ON r.event_id = e.id
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const rawRegs = await prisma.$queryRawUnsafe(querySql, ...dataParams);

    const registrations = rawRegs.map(r => {
      const firstMem = Array.isArray(r.members) && r.members.length > 0 ? r.members[0] : null;
      const leaderName = r.team_leader_name || firstMem?.name || 'Participant';
      const leaderEmail = r.team_leader_email || firstMem?.email || '';
      const leaderPhone = r.team_leader_phone || firstMem?.phone || '';
      const leaderDept = r.department || firstMem?.department || 'General';
      const paymentScreenshot = r.payment_screenshot_url || 'Free Event';
      const eventName = r.event_title || 'College Event';

      return {
        id: r.id,
        registrationNumber: `REG-${(r.id || '').substring(0, 6).toUpperCase()}`,
        eventId: r.event_id,
        eventName,
        eventTitle: eventName,
        teamName: r.team_leader_name,
        leaderName,
        teamLeaderName: leaderName,
        leaderRegisterNum: firstMem?.register_num || '',
        leaderDept,
        college: leaderDept,
        department: leaderDept,
        leaderEmail,
        teamLeaderEmail: leaderEmail,
        leaderPhone,
        teamLeaderPhone: leaderPhone,
        paymentScreenshot,
        paymentScreenshotUrl: paymentScreenshot,
        teamSize: Array.isArray(r.members) && r.members.length > 0 ? Math.max(1, r.members.length) : 1,
        utrNumber: '',
        status: r.status,
        rejectionReason: r.rejection_reason || null,
        reviewedById: r.reviewed_by || null,
        createdAt: r.created_at || new Date().toISOString(),
        registrationDate: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        updatedAt: r.updated_at || new Date().toISOString(),
        members: (r.members || []).map(m => ({
          id: m.id,
          registrationId: m.registration_id || m.registrationId,
          name: m.name,
          registerNum: m.register_num || m.registerNum,
          department: m.department,
          email: m.email,
          phone: m.phone
        }))
      };
    });

    return res.json({
      registrations,
      total,
      page,
      limit,
      hasMore: offset + registrations.length < total
    });
  } catch (err) {
    console.error('Management GET Registrations Error:', err);
    return res.status(500).json({ error: 'Failed to fetch management registrations' });
  }
});

// POST /api/registrations (Create new registration)
router.post('/', async (req, res) => {
  try {
    const payload = req.body;
    const regId = payload.id || randomUUID();

    await prisma.$executeRawUnsafe(
      `INSERT INTO registrations (id, event_id, team_leader_name, team_leader_email, team_leader_phone, department, payment_screenshot_url, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::"RegistrationStatus", NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET
         team_leader_name = EXCLUDED.team_leader_name,
         team_leader_email = EXCLUDED.team_leader_email,
         team_leader_phone = EXCLUDED.team_leader_phone,
         department = EXCLUDED.department,
         payment_screenshot_url = EXCLUDED.payment_screenshot_url,
         status = EXCLUDED.status,
         updated_at = NOW()`,
      regId,
      payload.eventId,
      payload.leaderName || payload.teamLeaderName || payload.teamName || 'Solo Participant',
      payload.leaderEmail || payload.teamLeaderEmail,
      payload.leaderPhone || payload.teamLeaderPhone || '',
      payload.leaderDept || payload.department || 'General',
      payload.paymentScreenshot || payload.paymentScreenshotUrl || null,
      payload.status || 'pending'
    );

    if (Array.isArray(payload.members)) {
      await prisma.$executeRawUnsafe(`DELETE FROM registration_members WHERE registration_id = $1`, regId);
      for (const m of payload.members) {
        if (m.name && m.name.trim()) {
          await prisma.$executeRawUnsafe(
            `INSERT INTO registration_members (id, registration_id, name, register_num, department, email, phone)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            m.id || randomUUID(),
            regId,
            m.name,
            m.registerNum || m.register_num || null,
            m.department || 'General',
            m.email || '',
            m.phone || ''
          );
        }
      }
    }

    return res.json({ success: true, id: regId });
  } catch (err) {
    console.error('POST /api/registrations Error:', err);
    return res.status(400).json({ error: err.message });
  }
});

// PUT /api/registrations/:id (General status update handler called by EMS Management DataContext)
router.put('/:id', async (req, res) => {
  try {
    const regId = req.params.id;
    const { status, remarks, rejectionReason } = req.body;
    const newStatus = (status || 'approved').toLowerCase();
    const reason = rejectionReason || remarks || (newStatus === 'rejected' ? 'Registration details could not be verified.' : null);

    if (newStatus === 'approved') {
      await prisma.$executeRawUnsafe(
        `UPDATE registrations SET status = 'approved'::"RegistrationStatus", updated_at = NOW() WHERE id = $1`,
        regId
      );

      const rawRegs = await prisma.$queryRawUnsafe(
        `SELECT r.team_leader_name, r.team_leader_email, e.title as event_title, e.venue, e.event_date, e.whatsapp_group_link
         FROM registrations r
         LEFT JOIN events e ON r.event_id = e.id
         WHERE r.id = $1 LIMIT 1`,
        regId
      );
      const reg = rawRegs && rawRegs.length > 0 ? rawRegs[0] : null;

      if (reg && reg.team_leader_email) {
        const whatsappHtml = reg.whatsapp_group_link ? `
          <div style="margin: 20px 0; padding: 16px; background-color: #e8f5e9; border-radius: 8px; border: 1px solid #c8e6c9;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #2e7d32;">📱 Official Event WhatsApp Group:</p>
            <p style="margin: 0 0 12px 0; font-size: 13px; color: #388e3c;">Join the official WhatsApp group for live event updates, schedule announcements, and coordinator Q&A:</p>
            <a href="${reg.whatsapp_group_link}" target="_blank" style="display: inline-block; padding: 10px 22px; background-color: #25D366; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">Join WhatsApp Group</a>
            <p style="margin: 10px 0 0 0; font-size: 11px; color: #666666;">Or copy link: <a href="${reg.whatsapp_group_link}" style="color: #25D366;">${reg.whatsapp_group_link}</a></p>
          </div>
        ` : '';

        await addEmailJob({
          to: reg.team_leader_email,
          subject: `Registration Approved - ${reg.event_title || 'College Event'}`,
          html: `
            <h3>🎉 Congratulations! Your Registration is Approved</h3>
            <p>Dear <strong>${reg.team_leader_name || 'Participant'}</strong>,</p>
            <p>Your team registration for <strong>${reg.event_title || 'College Event'}</strong> has been officially approved!</p>
            <p><strong>Venue:</strong> ${reg.venue || 'TBA'}<br/><strong>Date:</strong> ${reg.event_date || 'TBA'}</p>
            ${whatsappHtml}
            <br/>
            <p>Best regards,<br/>EMS Management Team</p>
          `
        }).catch(err => console.warn('Email queue dispatch notice:', err));
      }

      return res.json({ success: true, status: 'approved' });
    } else if (newStatus === 'rejected') {
      await prisma.$executeRawUnsafe(
        `UPDATE registrations SET status = 'rejected'::"RegistrationStatus", rejection_reason = $1, updated_at = NOW() WHERE id = $2`,
        reason,
        regId
      );

      const rawRegs = await prisma.$queryRawUnsafe(
        `SELECT r.team_leader_name, r.team_leader_email, e.title as event_title
         FROM registrations r
         LEFT JOIN events e ON r.event_id = e.id
         WHERE r.id = $1 LIMIT 1`,
        regId
      );
      const reg = rawRegs && rawRegs.length > 0 ? rawRegs[0] : null;

      if (reg && reg.team_leader_email) {
        await addEmailJob({
          to: reg.team_leader_email,
          subject: `Registration Update - ${reg.event_title || 'College Event'}`,
          html: `
            <h3>Registration Status Update</h3>
            <p>Dear ${reg.team_leader_name || 'Participant'},</p>
            <p>We regret to inform you that your registration for <strong>${reg.event_title || 'College Event'}</strong> was not approved.</p>
            <p><strong>Reason:</strong> ${reason}</p>
            <br/>
            <p>Best regards,<br/>EMS Management Team</p>
          `
        }).catch(err => console.warn('Email queue dispatch notice:', err));
      }

      return res.json({ success: true, status: 'rejected' });
    }

    return res.status(400).json({ error: 'Invalid status specified' });
  } catch (err) {
    console.error('PUT /api/registrations/:id Error:', err);
    return res.status(400).json({ error: err.message });
  }
});

export default router;
