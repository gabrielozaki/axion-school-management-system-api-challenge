import Redis from 'ioredis';

const runTest = async (redis, prefix) => {
  const key = `${prefix}:test:${new Date().getTime()}`;
  await redis.set(key, 'Redis Test Done.');
  const data = await redis.get(key);
  console.log(`Cache Test Data: ${data}`);
  redis.del(key);
};
export const createClient = ({ prefix, url }) => {
  console.log({ prefix, url });
  const redis = new Redis(url, {
    keyPrefix: `${prefix}:`,
  });
  // register client events
  redis.on('error', (error) => {
    console.log('error', error);
  });
  redis.on('end', () => {
    console.log('shutting down service due to lost Redis connection');
  });
  runTest(redis, prefix);
  return redis;
};
export default { createClient };
