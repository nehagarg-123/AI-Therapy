const { getJSON, setJSON, deleteByPattern } = require('../config/redis');

// Adjust this if your auth middleware stores the user differently.
const getUserId = (req) =>
  req.user?._id?.toString() || req.user?.id || req.userId || null;


const cache = (ttlSeconds = 60) => async (req, res, next) => {
  if (req.method !== 'GET') return next();

  const userId = getUserId(req);
  if (!userId) return next(); // never cache without a user in the key

  const key = `cache:${userId}:${req.originalUrl}`;

  const cached = await getJSON(key);
  if (cached) {
    console.log('CACHE HIT', key);                 // <-- add
    res.set('X-Cache', 'HIT');
    return res.status(200).json(cached);
  }
  console.log('CACHE MISS', key);                  // <-- add

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode === 200) {
      console.log('CACHE SET', key);               // <-- add
      setJSON(key, body, ttlSeconds);
    }
    res.set('X-Cache', 'MISS');
    return originalJson(body);
  };
  next();
};


const clearUserCache = async (userId) => {
  if (!userId) return;
  await deleteByPattern(`cache:${userId.toString()}:*`);
};

module.exports = { cache, clearUserCache };
