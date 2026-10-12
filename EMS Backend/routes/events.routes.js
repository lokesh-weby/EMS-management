import { Router } from 'express';
import { randomUUID } from 'crypto';
import { prisma } from '../lib/prisma.js';
import { mapEventRow } from '../utils/formatters.js';
import { addEmailJob } from '../queues/email.queue.js';

const router = Router();

// GET /api/events (Fetch Events with Search, Scope, Type, Status & Department Database Filtering)
router.get('/', async (req, res) => {
  try {
    const search = req.query.search ? req.query.search.trim() : '';
    const scope = req.query.scope && req.query.scope !== 'All' ? req.query.scope.trim() : '';
    const type = req.query.type && req.query.type !== 'All' ? req.query.type.trim() : '';
    const status = req.query.status && req.query.status !== 'All' ? req.query.status.trim() : '';
    const department = req.query.department && req.query.department !== 'All' ? req.query.department.trim() : '';

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(LOWER(e.title) LIKE $${paramIndex} OR LOWER(e.venue) LIKE $${paramIndex} OR LOWER(e.description) LIKE $${paramIndex})`);
      params.push(`%${search.toLowerCase()}%`);
      paramIndex++;
    }

    if (scope) {
      whereConditions.push(`LOWER(e.event_scope) = LOWER($${paramIndex})`);
      params.push(scope);
      paramIndex++;
    }

    if (type) {
      whereConditions.push(`LOWER(e.event_type) = LOWER($${paramIndex})`);
      params.push(type);
      paramIndex++;
    }

    if (status) {
      whereConditions.push(`LOWER(e.status::text) = LOWER($${paramIndex})`);
      params.push(status);
      paramIndex++;
    }

    if (department) {
      whereConditions.push(`LOWER(e.department) = LOWER($${paramIndex})`);
      params.push(department);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*)::int as total FROM events e ${whereClause}`;
    const countResult = await prisma.$queryRawUnsafe(countSql, ...params);
    const total = countResult[0]?.total || 0;

    const dataParams = [...params, limit, offset];
    const querySql = `
      SELECT e.*, 
        COALESCE(
          (SELECT json_agg(o.*) FROM event_organizers o WHERE o.event_id = e.id),
          '[]'::json
        ) as organizers
      FROM events e
      ${whereClause}
      ORDER BY e.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const rawEvents = await prisma.$queryRawUnsafe(querySql, ...dataParams);
    const events = rawEvents.map(mapEventRow);

    return res.json({
      events,
      total,
      page,
      limit,
      hasMore: offset + events.length < total
    });
  } catch (err) {
    console.error('Management GET Events Error:', err);
    return res.status(500).json({ error: 'Failed to fetch management events' });
  }
});

// Helper to guarantee a valid user ID satisfying events_created_by_fkey
async function getValidCreatedById(requestedUserId) {
  if (requestedUserId) {
    const existing = await prisma.users.findFirst({ where: { id: requestedUserId } });
    if (existing) return existing.id;
  }

  const anyUser = await prisma.users.findFirst();
  if (anyUser) return anyUser.id;

  const defaultAdmin = await prisma.users.create({
    data: {
      id: 'user-admin-01',
      full_name: 'System Admin',
      email: 'admin@srmist.in',
      role: 'admin',
      status: 'active',
      updated_at: new Date()
    }
  });
  return defaultAdmin.id;
}

// POST /api/events (Create Event)
router.post('/', async (req, res) => {
  try {
    const payload = req.body;
    const eventId = payload.id || randomUUID();
    const validCreatedById = await getValidCreatedById(req.user?.id || payload.createdById);

    await prisma.$executeRawUnsafe(
      `INSERT INTO events (id, title, description, department, event_scope, event_type, banner_url, event_date, start_time, end_time, registration_deadline, venue, registration_fee, max_team_size, whatsapp_group_link, upi_id, account_holder_name, upi_qr_url, status, created_by, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19::"EventStatus", $20, NOW())
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
      eventId,
      payload.title,
      payload.description || '',
      payload.department || 'Computer Science & Engineering',
      payload.eventScope || payload.event_scope || 'National',
      payload.eventType || payload.event_type || 'Competition',
      payload.bannerUrl || null,
      payload.eventDate,
      payload.startTime || '09:00',
      payload.endTime || '17:00',
      payload.registrationDeadline,
      payload.venue,
      parseFloat(payload.registrationFee) || 0,
      parseInt(payload.maxTeamSize) || 1,
      payload.whatsappGroupLink || null,
      payload.upiId || null,
      payload.accountHolderName || null,
      payload.upiQrUrl || null,
      payload.status === 'published' ? 'published' : 'draft',
      validCreatedById
    );

    // Sync Organizers
    if (Array.isArray(payload.organizers)) {
      await prisma.$executeRawUnsafe(`DELETE FROM event_organizers WHERE event_id = $1`, eventId);
      for (const o of payload.organizers) {
        if (o.name && o.name.trim()) {
          await prisma.$executeRawUnsafe(
            `INSERT INTO event_organizers (id, event_id, name, department, email, phone, register_number)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            o.id || randomUUID(),
            eventId,
            o.name,
            o.department || 'General',
            o.email || '',
            o.phone || '',
            o.registerNumber || null
          );
        }
      }
    }

    const rawCreated = await prisma.$queryRawUnsafe(`
      SELECT e.*, 
        COALESCE(
          (SELECT json_agg(o.*) FROM event_organizers o WHERE o.event_id = e.id),
          '[]'::json
        ) as organizers
      FROM events e
      WHERE e.id = $1 LIMIT 1
    `, eventId);

    return res.json(mapEventRow(rawCreated[0]));
  } catch (err) {
    console.error('POST /api/events Error:', err);
    return res.status(400).json({ error: err.message });
  }
});

// PUT /api/events/:id (Update Event)
router.put('/:id', async (req, res) => {
  try {
    const eventId = req.params.id;
    const payload = req.body;

    await prisma.$executeRawUnsafe(
      `UPDATE events SET
         title = COALESCE($1, title),
         description = COALESCE($2, description),
         department = COALESCE($3, department),
         event_scope = COALESCE($4, event_scope),
         event_type = COALESCE($5, event_type),
         banner_url = $6,
         event_date = COALESCE($7, event_date),
         start_time = COALESCE($8, start_time),
         end_time = COALESCE($9, end_time),
         registration_deadline = COALESCE($10, registration_deadline),
         venue = COALESCE($11, venue),
         registration_fee = $12,
         max_team_size = $13,
         whatsapp_group_link = $14,
         upi_id = $15,
         account_holder_name = $16,
         upi_qr_url = $17,
         status = COALESCE($18::"EventStatus", status),
         updated_at = NOW()
       WHERE id = $19`,
      payload.title,
      payload.description,
      payload.department,
      payload.eventScope || payload.event_scope,
      payload.eventType || payload.event_type,
      payload.bannerUrl || null,
      payload.eventDate,
      payload.startTime,
      payload.endTime,
      payload.registrationDeadline,
      payload.venue,
      parseFloat(payload.registrationFee) || 0,
      parseInt(payload.maxTeamSize) || 1,
      payload.whatsappGroupLink || null,
      payload.upiId || null,
      payload.accountHolderName || null,
      payload.upiQrUrl || null,
      payload.status,
      eventId
    );

    // Sync Organizers
    if (Array.isArray(payload.organizers)) {
      await prisma.$executeRawUnsafe(`DELETE FROM event_organizers WHERE event_id = $1`, eventId);
      for (const o of payload.organizers) {
        if (o.name && o.name.trim()) {
          await prisma.$executeRawUnsafe(
            `INSERT INTO event_organizers (id, event_id, name, department, email, phone, register_number)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            o.id || `org-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            eventId,
            o.name,
            o.department || 'General',
            o.email || '',
            o.phone || '',
            o.registerNumber || null
          );
        }
      }
    }

    const rawUpdated = await prisma.$queryRawUnsafe(`
      SELECT e.*, 
        COALESCE(
          (SELECT json_agg(o.*) FROM event_organizers o WHERE o.event_id = e.id),
          '[]'::json
        ) as organizers
      FROM events e
      WHERE e.id = $1 LIMIT 1
    `, eventId);

    return res.json(mapEventRow(rawUpdated[0]));
  } catch (err) {
    console.error('PUT /api/events/:id Error:', err);
    return res.status(400).json({ error: err.message });
  }
});

// DELETE /api/events/:id (Delete Event with Cascade Cleanup & Redis Cancellation Emails)
router.delete('/:id', async (req, res) => {
  try {
    const eventId = req.params.id;

    // 1. Fetch Event details before deleting
    const targetEvent = await prisma.events.findUnique({
      where: { id: eventId },
      select: { title: true, registration_fee: true }
    });

    if (!targetEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // 2. Fetch all registered participants (Team Leaders & Team Members)
    const registeredParticipants = await prisma.$queryRawUnsafe(`
      SELECT DISTINCT email, name FROM (
        SELECT team_leader_email as email, team_leader_name as name
        FROM registrations WHERE event_id = $1 AND team_leader_email IS NOT NULL AND team_leader_email != ''
        UNION
        SELECT rm.email as email, rm.name as name
        FROM registration_members rm
        JOIN registrations r ON rm.registration_id = r.id
        WHERE r.event_id = $1 AND rm.email IS NOT NULL AND rm.email != ''
      ) participants
    `, eventId);

    // 3. Queue cancellation emails via Redis (BullMQ)
    if (Array.isArray(registeredParticipants) && registeredParticipants.length > 0) {
      const isPaidEvent = Number(targetEvent.registration_fee) > 0;
      const feeVal = targetEvent.registration_fee;

      for (const p of registeredParticipants) {
        const emailBody = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #e11d48;">Event Cancellation Notice</h2>
            <p>Dear <strong>${p.name || 'Participant'}</strong>,</p>
            <p>We regret to inform you that the event <strong>"${targetEvent.title}"</strong> has been cancelled by the organizers due to unforeseen circumstances.</p>
            ${
              isPaidEvent
                ? `<div style="background-color: #f8fafc; border-left: 4px solid #0284c7; padding: 12px; margin: 15px 0; rounded-radius: 6px;">
                    <p style="margin: 0; font-weight: bold; color: #0369a1;">💰 Refund Information:</p>
                    <p style="margin: 5px 0 0 0;">Your paid registration fee of <strong>INR ${feeVal}</strong> will be refunded to your original payment method within 3–5 business days.</p>
                   </div>`
                : `<p style="color: #64748b;"><em>Note: As this was a free entry event, no payment refund processing is required.</em></p>`
            }
            <p>We apologize for any inconvenience caused and thank you for your understanding.</p>
            <br/>
            <p>Best regards,<br/><strong>College EMS Management Team</strong></p>
          </div>
        `;

        addEmailJob({
          to: p.email,
          subject: `Event Cancelled: ${targetEvent.title}`,
          html: emailBody
        }).catch(err => console.warn(`[Redis Queue Warning] Cancellation email error for ${p.email}:`, err));
      }
    }

    // 4. Delete Event record from DB (triggers cascade delete on registrations)
    await prisma.events.delete({
      where: { id: eventId }
    });

    return res.json({ 
      message: 'Event deleted successfully', 
      notifiedParticipants: registeredParticipants ? registeredParticipants.length : 0 
    });
  } catch (err) {
    console.error('DELETE /api/events/:id Error:', err);
    return res.status(500).json({ error: 'Failed to delete event' });
  }
});

export default router;
