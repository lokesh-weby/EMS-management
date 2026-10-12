import { Router } from 'express';
import { randomUUID } from 'crypto';
import { prisma } from '../lib/prisma.js';
import { getAuth } from '../config/firebase.js';

const router = Router();

// Middleware: Require Admin role for all /api/users routes
router.use((req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized: Access denied. Admin privileges required.' });
  }
  next();
});

// GET /api/users (Fetch Users & Coordinators with Search, Role, Status & Pagination)
router.get('/', async (req, res) => {
  try {
    const search = req.query.search ? req.query.search.trim() : '';
    const role = req.query.role && req.query.role !== 'all' && req.query.role !== 'All' ? req.query.role.trim() : '';
    const status = req.query.status && req.query.status !== 'all' && req.query.status !== 'All' ? req.query.status.trim() : '';

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(
        LOWER(full_name) LIKE $${paramIndex} OR 
        LOWER(email) LIKE $${paramIndex} OR 
        LOWER(phone) LIKE $${paramIndex}
      )`);
      params.push(`%${search.toLowerCase()}%`);
      paramIndex++;
    }

    if (role) {
      whereConditions.push(`LOWER(role::text) = LOWER($${paramIndex})`);
      params.push(role);
      paramIndex++;
    }

    if (status) {
      whereConditions.push(`LOWER(status::text) = LOWER($${paramIndex})`);
      params.push(status);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*)::int as total FROM users ${whereClause}`;
    const countResult = await prisma.$queryRawUnsafe(countSql, ...params);
    const total = countResult[0]?.total || 0;

    const dataParams = [...params, limit, offset];
    const querySql = `
      SELECT * FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const rawUsers = await prisma.$queryRawUnsafe(querySql, ...dataParams);

    const users = rawUsers.map(u => ({
      id: u.id,
      firebaseUid: u.firebase_uid || u.firebaseUid,
      fullName: u.full_name || u.fullName,
      email: u.email,
      phone: u.phone,
      role: u.role,
      status: u.status,
      createdAt: u.created_at || u.createdAt
    }));

    return res.json({
      users,
      total,
      page,
      limit,
      hasMore: offset + users.length < total
    });
  } catch (err) {
    console.error('Management GET Users Error:', err);
    return res.status(500).json({ error: 'Failed to fetch management users' });
  }
});

// POST /api/users (Create or Update User in DB)
router.post('/', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const userId = payload.id || randomUUID();
    const fullName = payload.fullName || payload.name || payload.email.split('@')[0];
    const firebaseUid = payload.firebaseUid || payload.firebase_uid || `fb-${userId}`;
    const phone = payload.phone || '';
    const role = (payload.role || 'coordinator').toLowerCase();
    const status = (payload.status || 'active').toLowerCase();

    await prisma.$executeRawUnsafe(
      `INSERT INTO users (id, firebase_uid, full_name, email, phone, role, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6::"Role", $7::"Status", NOW(), NOW())
       ON CONFLICT (email) DO UPDATE SET
         full_name = EXCLUDED.full_name,
         firebase_uid = EXCLUDED.firebase_uid,
         phone = EXCLUDED.phone,
         role = EXCLUDED.role,
         status = EXCLUDED.status,
         updated_at = NOW()`,
      userId,
      firebaseUid,
      fullName,
      payload.email.trim(),
      phone,
      role,
      status
    );

    console.log(`Successfully saved user in DB: ${payload.email} (${role})`);
    return res.json({ id: userId, firebaseUid, fullName, email: payload.email, phone, role, status });
  } catch (err) {
    console.error('POST /api/users Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id/role (Update User Role)
router.put('/:id/role', async (req, res) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;
    if (!role) {
      return res.status(400).json({ error: 'Role is required' });
    }

    await prisma.$executeRawUnsafe(
      `UPDATE users SET role = $1::"Role", updated_at = NOW() WHERE id = $2`,
      role.toLowerCase(),
      userId
    );

    return res.json({ id: userId, role });
  } catch (err) {
    console.error('PUT /api/users/:id/role Error:', err);
    return res.status(400).json({ error: err.message });
  }
});

// DELETE /api/users/:id (Delete User from Firebase Auth & PostgreSQL DB)
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    // 1. Fetch user from DB to obtain firebase_uid and email
    const existingUsers = await prisma.$queryRawUnsafe(`SELECT id, email, firebase_uid FROM users WHERE id = $1 LIMIT 1`, userId);
    const user = existingUsers && existingUsers.length > 0 ? existingUsers[0] : null;

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const firebaseUid = user.firebase_uid || user.firebaseUid;

    // 2. Delete from Firebase Authentication by UID if valid
    let deletedFromFirebase = false;
    if (firebaseUid && !firebaseUid.startsWith('fb-')) {
      try {
        await getAuth().deleteUser(firebaseUid);
        deletedFromFirebase = true;
        console.log(`Deleted user ${firebaseUid} from Firebase Auth by UID`);
      } catch (fbErr) {
        console.warn(`Firebase Auth UID deletion note for ${firebaseUid}:`, fbErr.message);
      }
    }

    // Fallback: Delete from Firebase Authentication by Email if UID lookup didn't succeed
    if (!deletedFromFirebase && user.email) {
      try {
        const fbUser = await getAuth().getUserByEmail(user.email);
        if (fbUser && fbUser.uid) {
          await getAuth().deleteUser(fbUser.uid);
          console.log(`Deleted user ${user.email} from Firebase Auth by Email (UID: ${fbUser.uid})`);
        }
      } catch (fbEmailErr) {
        console.warn(`Firebase Auth Email lookup note for ${user.email}:`, fbEmailErr.message);
      }
    }

    // 3. Delete user from PostgreSQL database using Prisma
    await prisma.users.delete({
      where: { id: userId }
    });

    return res.json({ message: 'User deleted successfully from Firebase and Database' });
  } catch (err) {
    console.error('DELETE /api/users/:id Error:', err);
    return res.status(500).json({ error: err.message || 'Failed to delete user' });
  }
});

export default router;
