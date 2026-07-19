const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const {
  getOrCreateConversation,
  getConversations,
  getConversationMessages,
  sendMessage,
  markMessagesAsRead,
} = require('../controllers/chatController');

const router = express.Router();

router.use(authMiddleware);
router.get('/conversations', getConversations);
router.post('/conversations/:doctorId', getOrCreateConversation);
router.get('/messages/:conversationId', getConversationMessages);
router.post('/messages', sendMessage);
router.patch('/messages/read/:conversationId', markMessagesAsRead);

module.exports = router;
