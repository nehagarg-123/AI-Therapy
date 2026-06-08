const express = require('express');
const axios   = require('axios');
const router  = express.Router();
const { protect } = require('../middleware/auth.middleware');

// Proxy to Python ML service with auth
router.post('/analyze', protect, async (req, res, next) => {
  try {
    const response = await axios.post(`${process.env.ML_SERVICE_URL}/predict`, req.body, { timeout: 8000 });
    res.json({ success: true, data: response.data });
  } catch (err) {
    res.json({ success: false, message: 'ML service unavailable', data: null });
  }
});

router.get('/health', async (req, res) => {
  try {
    const response = await axios.get(`${process.env.ML_SERVICE_URL}/health`, { timeout: 3000 });
    res.json({ success: true, ml: response.data });
  } catch {
    res.json({ success: false, message: 'ML service offline' });
  }
});

module.exports = router;
