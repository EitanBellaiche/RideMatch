const express = require('express');
const router = express.Router();
const { getMessages, sendMessage } = require('../controllers/chatController');

router.get('/get-messages', getMessages);
router.post('/send-message', sendMessage);

module.exports = router;
