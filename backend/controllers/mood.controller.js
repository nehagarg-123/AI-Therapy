const MoodEntry = require('../models/MoodEntry.model');
const { AppError } = require('../middleware/error.middleware');

// ── LOG MOOD MANUALLY ─────────────────────────────────────────────────────
exports.logMood = async (req, res, next) => {
  try {
    const { emotion, score, note, triggers } = req.body;
    if (!emotion) return next(new AppError('Emotion is required', 400));

    const entry = await MoodEntry.create({
      user: req.user._id,
      emotion, score, note,
      triggers: triggers || [],
      source: 'manual',
    });
    res.status(201).json({ success: true, data: { entry } });
  } catch (err) { next(err); }
};

// ── GET MOOD HISTORY ──────────────────────────────────────────────────────
exports.getMoodHistory = async (req, res, next) => {
  try {
    const { days = 30, limit = 100 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const entries = await MoodEntry.find({
      user: req.user._id,
      date: { $gte: since },
    }).sort('-date').limit(parseInt(limit));

    res.json({ success: true, data: { entries, count: entries.length } });
  } catch (err) { next(err); }
};

// ── MOOD ANALYTICS ────────────────────────────────────────────────────────
exports.getMoodAnalytics = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const entries = await MoodEntry.find({ user: req.user._id, date: { $gte: since } });

    // Emotion frequency
    const emotionFreq = entries.reduce((acc, e) => {
      acc[e.emotion] = (acc[e.emotion]||0) + 1;
      return acc;
    }, {});

    // Average sentiment
    const avgSentiment = entries.length
      ? entries.reduce((s, e) => s + (e.sentiment||0), 0) / entries.length
      : 0;

    // Crisis count
    const crisisCount = entries.filter(e => e.isCrisis).length;

    // Daily mood trend
    const dailyTrend = {};
    entries.forEach(e => {
      const day = e.date.toISOString().slice(0,10);
      if (!dailyTrend[day]) dailyTrend[day] = [];
      dailyTrend[day].push(e.emotion);
    });

    const dominantEmotion = Object.entries(emotionFreq).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'neutral';

    res.json({
      success: true,
      data: {
        totalEntries: entries.length,
        emotionFrequency: emotionFreq,
        dominantEmotion,
        averageSentiment: parseFloat(avgSentiment.toFixed(2)),
        crisisCount,
        dailyTrend,
      }
    });
  } catch (err) { next(err); }
};
