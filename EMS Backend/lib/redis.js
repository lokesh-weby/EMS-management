import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,
  retryStrategy(times) {
    return Math.min(times * 1000, 5000);
  }
};

export const redisConnection = new Redis(redisConfig);

redisConnection.on('connect', () => {
  console.log('⚡ Connected to Memurai/Redis Server');
});

let lastLoggedError = 0;
redisConnection.on('error', (err) => {
  const now = Date.now();
  if (now - lastLoggedError > 10000) {
    console.error('❌ Redis Connection Error (127.0.0.1:6379): Memurai/Redis server is not running.');
    lastLoggedError = now;
  }
});

