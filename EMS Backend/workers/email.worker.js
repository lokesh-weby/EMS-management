import { Worker } from 'bullmq';
import { redisConnection } from '../lib/redis.js';
import { EMAIL_QUEUE_NAME } from '../queues/email.queue.js';
import { sendEmail } from '../services/email.service.js';

export const emailWorker = new Worker(
  EMAIL_QUEUE_NAME,
  async (job) => {
    console.log(`[EmailWorker] Processing Job #${job.id}: Sending "${job.data.subject}" to ${job.data.to}`);
    const result = await sendEmail(job.data);
    console.log(`[EmailWorker] Job #${job.id} completed successfully for ${job.data.to}`);
    return result;
  },
  {
    connection: redisConnection,
    concurrency: 5 // Process up to 5 emails in parallel
  }
);

emailWorker.on('completed', (job) => {
  console.log(`[EmailWorker Event] Job #${job.id} finished processing.`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`[EmailWorker Event]  Job #${job?.id} failed with error:`, err.message);
});

let lastWorkerError = 0;
emailWorker.on('error', (err) => {
  const now = Date.now();
  if (now - lastWorkerError > 10000) {
    console.error('[EmailWorker Event] Waiting for Redis service on 127.0.0.1:6379...');
    lastWorkerError = now;
  }
});
