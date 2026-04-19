const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    getBroadcasts,
    createBroadcast,
    updateBroadcast,
    deleteBroadcast,
    sendBroadcastNow,
} = require('../controllers/broadcastController');

router.get('/', protect, admin, getBroadcasts);
router.post('/', protect, admin, createBroadcast);
router.put('/:id', protect, admin, updateBroadcast);
router.delete('/:id', protect, admin, deleteBroadcast);
router.post('/:id/send', protect, admin, sendBroadcastNow);

module.exports = router;
