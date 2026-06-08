// ── auth.routes.js ───────────────────────────────────────────────────────
const express = require('express');
const router  = express.Router();
const auth    = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/register',         auth.register);
router.post('/login',            auth.login);
router.post('/refresh-token',    auth.refreshToken);
router.post('/logout',    protect, auth.logout);
router.get('/me',         protect, auth.getMe);
router.patch('/change-password', protect, auth.changePassword);
router.post('/forgot-password', auth.forgotPassword);
router.post('/reset-password',  auth.resetPassword);

router.get('/test-email', async (req, res) => {
  const sendEmail = require('../utils/sendEmail');
  try {
    await sendEmail({
      to: 'youremail@gmail.com',   // 👈 put your real email here
      subject: 'MindEase Test',
      html: '<h2>Test email working!</h2>',
    });
    res.json({ success: true, message: 'Email sent!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
