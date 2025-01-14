import Redis from 'ioredis';
import logger from '../libs/logger';

const runTest = async (redis, prefix) => {
  const key = `${prefix}:test:${new Date().getTime()}`;
  await redis.set(key, 'Redis Test Done.');
  const data = await redis.get(key);
  logger.info(`Cache Test Data: ${data}`);
  redis.del(key);
};
export const createClient = ({ prefix, url }) => {
  logger.info({ prefix, url });
  const redis = new Redis(url, {
    keyPrefix: `${prefix}:`,
  });
  // register client events
  redis.on('error', (error) => {
    logger.error('Error', error);
  });
  redis.on('end', () => {
    logger.info('shutting down service due to lost Redis connection');
  });
  runTest(redis, prefix);
  return redis;
};
export default { createClient };
