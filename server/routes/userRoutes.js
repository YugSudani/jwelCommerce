const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const { authUser, registerUser, getUserProfile, updateUserProfile, logoutUser } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', registerUser);
router.post('/login', authUser);
router.post('/logout', logoutUser);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.put('/notification', protect, async (req, res, next) => {
  try {
    console.log('[UserRoutes] /notification called, user:', req.user._id);
    const user = await User.findById(req.user._id);
    if (!user) {
      console.log('[UserRoutes] User not found');
      return res.status(404).json({ message: 'User not found' });
    }
    const { playerID, notificationEnabled } = req.body;
    console.log('[UserRoutes] Saving notification:', { playerID, notificationEnabled });

    if (playerID !== undefined) {
      // Always update primary playerID (most recent device)
      user.playerID = playerID;

      // Append to playerIDs array only if not already present (multi-device)
      if (!user.playerIDs) user.playerIDs = [];
      if (!user.playerIDs.includes(playerID)) {
        user.playerIDs.push(playerID);
        console.log('[UserRoutes] Appended new playerID to array. Total IDs:', user.playerIDs.length);
      } else {
        console.log('[UserRoutes] playerID already in array, skipping duplicate');
      }
    }

    if (notificationEnabled !== undefined) {
      user.notificationEnabled = notificationEnabled;
    }

    await user.save();
    console.log('[UserRoutes] Notification saved. playerID:', user.playerID, 'playerIDs count:', user.playerIDs.length);
    res.json({
      message: 'Notification settings updated',
      playerID: user.playerID,
      playerIDs: user.playerIDs,
      notificationEnabled: user.notificationEnabled,
    });
  } catch (err) {
    console.log('[UserRoutes] Error saving notification:', err.message);
    next(err);
  }
});
router.head('/healthCheck', (req, res) => {
  res.status(200).end();
});

module.exports = router;

