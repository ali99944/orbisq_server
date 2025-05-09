import { Worker, Queue } from 'bullmq';

import IORedis from 'ioredis';
const sharedConnection = new IORedis({
  host: 'localhost',
  port: 6379,
  maxRetriesPerRequest: null,
});

const redisConfig = {
  connection: sharedConnection,
  concurrency: 100,
};

// Initialize the queue
const driverReportQueue = new Queue('driver_reports', redisConfig);

// Define the worker to process jobs
const worker = new Worker('driver_reports', async (job) => {
  try {
    
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}, redisConfig);

await worker.waitUntilReady();

export default driverReportQueue