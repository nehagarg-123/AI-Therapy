const express    = require('express');
const moodRouter = express.Router();
const mood       = require('../controllers/mood.controller');
const { protect } = require('../middleware/auth.middleware');
const { cache }   = require('../middleware/cache.middleware');

moodRouter.use(protect);
moodRouter.post('/',           mood.logMood);
moodRouter.get('/history',   cache(120), mood.getMoodHistory);
moodRouter.get('/analytics', cache(120), mood.getMoodAnalytics);

module.exports = moodRouter;
