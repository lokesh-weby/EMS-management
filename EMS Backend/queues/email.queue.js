import { Queue } from 'bullmq';
import { redisConnection } from '../lib/redis.js';

export const EMAIL_QUEUE_NAME = 'email-queue';

export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
  connection: redisConnection
});

/**
 * Add an email dispatch task to BullMQ
 * @param {Object} payload - { to, subject, html, text }
 * @param {Object} options - Custom BullMQ job options
 */
export const addEmailJob = async (payload, options = {}) => {
  try {
    const job = await emailQueue.add('send-email', payload, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      removeOnComplete: 100, // Keep last 100 completed jobs for history
      removeOnFail: 500, // Keep last 500 failed jobs for debugging
      ...options
    });
    console.log(`[EmailQueue] 📥 Enqueued Email Job #${job.id} to ${payload.to}`);
    return job;
  } catch (err) {
    console.warn('[EmailQueue] Redis/Queue offline. Falling back to direct email sending:', err.message);
    try {
      const { sendEmail } = await import('../services/email.service.js');
      const result = await sendEmail(payload);
      console.log(`[EmailQueue Direct Fallback] ✉️ Sent email directly to ${payload.to}`);
      return result;
    } catch (fallbackErr) {
      console.error('[EmailQueue Direct Fallback Error]', fallbackErr);
      throw fallbackErr;
    }
  }
};
