// ── mood.routes.js ───────────────────────────────────────────────────────
const express    = require('express');
const moodRouter = express.Router();
const mood       = require('../controllers/mood.controller');
const { protect } = require('../middleware/auth.middleware');

moodRouter.use(protect);
moodRouter.post('/',           mood.logMood);
moodRouter.get('/history',     mood.getMoodHistory);
moodRouter.get('/analytics',   mood.getMoodAnalytics);

module.exports = moodRouter;
