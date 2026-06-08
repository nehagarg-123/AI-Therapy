const express = require('express');
const router  = express.Router();
const chat    = require('../controllers/chat.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect); // all chat routes require auth

router.get('/session',          chat.getOrCreateSession);
router.post('/message',         chat.sendMessage);
router.get('/sessions',         chat.getSessions);
router.patch('/session/:id/end',chat.endSession);

module.exports = router;
