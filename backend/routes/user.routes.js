// ── user.routes.js ───────────────────────────────────────────────────────
const express    = require('express');
const userRouter = express.Router();
const User       = require('../models/User.model');
const { protect } = require('../middleware/auth.middleware');
const { AppError } = require('../middleware/error.middleware');

userRouter.use(protect);

userRouter.get('/profile', async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, data: { user } });
  } catch (err) { next(err); }
});

userRouter.patch('/profile', async (req, res, next) => {
  try {
    const allowed = ['name','avatar','dateOfBirth','therapyGoals','preferredActivities','emergencyContact','emergencyName','settings'];
    const updates = {};
    allowed.forEach(key => { if (req.body[key] !== undefined) updates[key] = req.body[key]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, data: { user } });
  } catch (err) { next(err); }
});

userRouter.delete('/account', async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.clearCookie('accessToken'); res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Account deleted' });
  } catch (err) { next(err); }
});

module.exports = userRouter;
