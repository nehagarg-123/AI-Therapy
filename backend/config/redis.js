const Redis = require('ioredis');

let client = null;

if (process.env.REDIS_URL) {
  // A rediss:// URL (e.g. Upstash) enables TLS automatically
  client = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false, // fail fast when Redis is down instead of queueing commands
    retryStrategy: (times) => Math.min(times * 500, 5000),
  });

  client.on('ready', () => console.log('Redis connected'));

  // Log at most once every 10 seconds so the console is not flooded
  let lastErrorLog = 0;
  client.on('error', (err) => {
    const now = Date.now();
    if (now - lastErrorLog > 10000) {
      console.error('Redis error:', err.code || err.message || err);
      lastErrorLog = now;
    }
  });

  client.on('end', () => console.warn('Redis connection closed'));
} else {
  console.warn('REDIS_URL not set - caching is disabled');
}

const isReady = () => client && client.status === 'ready';

// All helpers swallow errors so the app keeps working if Redis is down.
const getJSON = async (key) => {
  if (!isReady()) return null;
  try {
    const val = await client.get(key);
    return val ? JSON.parse(val) : null;
  } catch (err) {
    console.error('Redis get failed:', err.message);
    return null;
  }
};

const setJSON = async (key, value, ttlSeconds = 60) => {
  if (!isReady()) return;
  try {
    await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (err) {
    console.error('Redis set failed:', err.message);
  }
};

// Deletes all keys matching a pattern using SCAN (safe, unlike KEYS).
const deleteByPattern = async (pattern) => {
  if (!isReady()) return;
  try {
    const stream = client.scanStream({ match: pattern, count: 100 });
    for await (const keys of stream) {
      if (keys.length) await client.del(...keys);
    }
  } catch (err) {
    console.error('Redis delete failed:', err.message);
  }
};

module.exports = { client, isReady, getJSON, setJSON, deleteByPattern };
