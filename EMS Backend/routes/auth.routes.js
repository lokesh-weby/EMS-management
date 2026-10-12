import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { getAuth } from 'firebase-admin/auth';
import { prisma } from '../lib/prisma.js';
import { JWT_SECRET } from '../middleware/auth.middleware.js';

const router = Router();

// POST /api/auth/check-user (Check if user exists in Firebase Auth or DB)
router.post('/check-user', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ exists: false, error: 'Email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Check in Firebase Auth via Firebase Admin SDK
    try {
      const userRecord = await getAuth().getUserByEmail(cleanEmail);
      if (userRecord) {
        return res.json({
          exists: true,
          uid: userRecord.uid,
          email: userRecord.email,
          providers: userRecord.providerData.map(p => p.providerId)
        });
      }
    } catch (fbErr) {
      if (fbErr.code === 'auth/user-not-found') {
        return res.json({ exists: false, message: `User ${cleanEmail} is not registered in Firebase Auth.` });
      }
      console.warn('Firebase Admin check-user warning:', fbErr.message);
    }

    // 2. Check in PostgreSQL database
    const existingUsers = await prisma.$queryRawUnsafe(
      `SELECT id, email, role FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      cleanEmail
    );
    if (existingUsers && existingUsers.length > 0) {
      return res.json({ exists: true, email: existingUsers[0].email, source: 'database' });
    }

    return res.json({ exists: false, message: `User ${cleanEmail} was not found in Firebase Auth or database.` });
  } catch (err) {
    console.error('Check user error:', err);
    return res.status(500).json({ exists: false, error: err.message });
  }
});

// POST /api/auth/login (Public Login & Token Generation)
router.post('/login', async (req, res) => {
  try {
    const { email, firebaseUid, fullName, role } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required for authentication' });
    }

    let user = null;
    const existingUsers = await prisma.$queryRawUnsafe(`SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`, email);
    if (existingUsers && existingUsers.length > 0) {
      const u = existingUsers[0];
      const userFullName = u.full_name || u.fullName || email.split('@')[0];
      user = {
        id: u.id,
        firebaseUid: u.firebase_uid || u.firebaseUid || firebaseUid,
        fullName: userFullName,
        full_name: userFullName,
        email: u.email,
        phone: u.phone,
        role: u.role,
        status: u.status,
        createdAt: u.created_at || u.createdAt
      };
    } else {
      const userId = randomUUID();
      const userFullName = fullName || email.split('@')[0];
      await prisma.$executeRawUnsafe(
        `INSERT INTO users (id, firebase_uid, full_name, email, phone, role, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, '', $5::"Role", 'active'::"Status", NOW(), NOW())`,
        userId,
        firebaseUid || `fb-${userId}`,
        userFullName,
        email,
        role || 'coordinator'
      );
      user = { 
        id: userId, 
        firebaseUid: firebaseUid || `fb-${userId}`, 
        email, 
        fullName: userFullName, 
        full_name: userFullName, 
        role: role || 'coordinator', 
        status: 'active' 
      };
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role || 'coordinator' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({ token, user });
  } catch (err) {
    console.error('Auth Login Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
