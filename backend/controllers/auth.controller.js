const jwt  = require('jsonwebtoken');
const User = require('../models/User.model');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const { AppError } = require('../middleware/error.middleware');

// ── Token helpers ─────────────────────────────────────────────────────────
const signAccessToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

const signRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' });

const sendTokens = (user, statusCode, res) => {
  const accessToken  = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  };

  res.cookie('accessToken',  accessToken,  { ...cookieOptions, maxAge: 7  * 24*60*60*1000 });
  res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 30 * 24*60*60*1000 });

  // Store refresh token hash in DB
  User.findByIdAndUpdate(user._id, { refreshToken }).exec();

  user.password     = undefined;
  user.refreshToken = undefined;

  res.status(statusCode).json({
    success: true,
    accessToken,
    data: { user },
  });
};

// ── REGISTER ──────────────────────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return next(new AppError('Please provide name, email and password', 400));

    if (password.length < 8)
      return next(new AppError('Password must be at least 8 characters', 400));

    const existing = await User.findOne({ email });
    if (existing) return next(new AppError('Email already registered', 400));

    const user = await User.create({ name, email, password });
    sendTokens(user, 201, res);
  } catch (err) { next(err); }
};

// ── LOGIN ─────────────────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return next(new AppError('Please provide email and password', 400));

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password)))
      return next(new AppError('Incorrect email or password', 401));

   

    sendTokens(user, 200, res);
  } catch (err) { next(err); }
};

// ── REFRESH TOKEN ─────────────────────────────────────────────────────────
exports.refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken || req.body.refreshToken;
    if (!token) return next(new AppError('No refresh token', 401));

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user) return next(new AppError('User not found', 401));

    const newAccessToken = signAccessToken(user._id);
    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24*60*60*1000,
    });

    res.json({ success: true, accessToken: newAccessToken });
  } catch (err) {
    next(new AppError('Invalid or expired refresh token', 401));
  }
};

// ── LOGOUT ────────────────────────────────────────────────────────────────
exports.logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) { next(err); }
};

// ── GET CURRENT USER ──────────────────────────────────────────────────────
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, data: { user } });
  } catch (err) { next(err); }
};

// ── CHANGE PASSWORD ───────────────────────────────────────────────────────
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.comparePassword(currentPassword)))
      return next(new AppError('Current password is incorrect', 401));

    if (newPassword.length < 8)
      return next(new AppError('New password must be at least 8 characters', 400));

    user.password = newPassword;
    await user.save();
    sendTokens(user, 200, res);
  } catch (err) { next(err); }
};

// ── FORGOT PASSWORD ───────────────────────────────────────────────────────
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Always return success to prevent email enumeration
    if (!user) return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });

    const token     = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

    user.resetPasswordToken   = token;
    user.resetPasswordExpires = expiresAt;
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

    await sendEmail({
      to:      user.email,
      subject: 'Reset your MindEase password',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
          <h2 style="color: #4a7c59;">Reset your password</h2>
          <p>Hi ${user.name},</p>
          <p>Click below to reset your password. Expires in <strong>1 hour</strong>.</p>
          <a href="${resetUrl}" style="display:inline-block; margin:20px 0; padding:12px 28px; background:#4a7c59; color:#fff; border-radius:50px; text-decoration:none; font-weight:600;">
            Reset Password
          </a>
          <p style="color:#888; font-size:13px;">If you didn't request this, ignore this email.</p>
        </div>
      `,
    });

    res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  } catch (err) { next(err); }
};

// ── RESET PASSWORD ────────────────────────────────────────────────────────
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({
      resetPasswordToken:   token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) return next(new AppError('Invalid or expired reset link.', 400));

    if (password.length < 8)
      return next(new AppError('Password must be at least 8 characters', 400));

    user.password             = password; // pre-save hook hashes it
    user.resetPasswordToken   = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully.' });
  } catch (err) { next(err); }
};
