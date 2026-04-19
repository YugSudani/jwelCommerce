const express = require('express');
const router = express.Router();
const { getSortMode, setSortMode, setAdminPlayerIDs, getAdminPlayerIDs } = require('../controllers/settingsController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/sort', getSortMode);
router.put('/sort', protect, admin, setSortMode);
router.get('/admin-player-ids', protect, admin, getAdminPlayerIDs);
router.put('/admin-player-ids', protect, admin, setAdminPlayerIDs);

module.exports = router;
