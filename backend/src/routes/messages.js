const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

router.get('/threads', messageController.getThreads);
router.get('/:userId', messageController.getHistory);
router.post('/', messageController.sendMessage);
router.patch('/:messageId/read', messageController.markRead);
router.patch('/:userId/read-all', messageController.markAllRead);

module.exports = router;
