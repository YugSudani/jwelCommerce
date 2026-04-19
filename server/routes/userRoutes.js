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

// Save / update push notification player ID for the logged-in user
router.put('/notification', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { playerID, notificationEnabled } = req.body;

    if (playerID !== undefined) {
      user.playerID = playerID;

      if (!user.playerIDs) user.playerIDs = [];
      if (!user.playerIDs.includes(playerID)) {
        user.playerIDs.push(playerID);
      }
    }

    if (notificationEnabled !== undefined) {
      user.notificationEnabled = notificationEnabled;
    }

    await user.save();
    res.json({
      message: 'Notification settings updated',
      playerID: user.playerID,
      playerIDs: user.playerIDs,
      notificationEnabled: user.notificationEnabled,
    });
  } catch (err) {
    console.error('[User] Save notification error:', err.message);
    next(err);
  }
});

router.head('/healthCheck', (req, res) => res.status(200).end());

module.exports = router;
