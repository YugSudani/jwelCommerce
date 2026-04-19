const Broadcast = require('../models/broadcastModel');
const User = require('../models/userModel');
const { sendNotification } = require('../services/broadcastNotificationService');

// ─── Collect all unique subscriber IDs across all users ──────────────────────
const getAllSubscriberIds = async () => {
    const users = await User.find({ notificationEnabled: true }).select('playerID playerIDs');
    const set = new Set();
    for (const u of users) {
        if (u.playerID) set.add(u.playerID);
        if (Array.isArray(u.playerIDs)) u.playerIDs.forEach((id) => { if (id) set.add(id); });
    }
    return Array.from(set);
};

// @desc  Get all broadcasts
// @route GET /api/broadcast
// @access Private/Admin
const getBroadcasts = async (req, res) => {
    try {
        const list = await Broadcast.find().sort({ createdAt: -1 });
        res.json(list);
    } catch (err) {
        console.error('[Broadcast] Get error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc  Create a broadcast (manual or scheduled)
// @route POST /api/broadcast
// @access Private/Admin
const createBroadcast = async (req, res) => {
    try {
        const { title, message, isScheduled, intervalDays } = req.body;
        if (!title?.trim() || !message?.trim()) {
            return res.status(400).json({ message: 'Title and message are required' });
        }

        const broadcast = await Broadcast.create({
            title: title.trim(),
            message: message.trim(),
            isScheduled: !!isScheduled,
            intervalDays: isScheduled ? (intervalDays || 3) : undefined,
            nextFireAt: isScheduled ? new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000) : null,
        });

        console.log(`[Broadcast] Created "${title}" (scheduled=${isScheduled}) by admin "${req.user.name}"`);
        res.status(201).json(broadcast);
    } catch (err) {
        console.error('[Broadcast] Create error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc  Update a broadcast (title, message, isScheduled, intervalDays)
// @route PUT /api/broadcast/:id
// @access Private/Admin
const updateBroadcast = async (req, res) => {
    try {
        const broadcast = await Broadcast.findById(req.params.id);
        if (!broadcast) return res.status(404).json({ message: 'Not found' });

        const { title, message, isScheduled, intervalDays } = req.body;
        if (title !== undefined) broadcast.title = title.trim();
        if (message !== undefined) broadcast.message = message.trim();

        const wasScheduled = broadcast.isScheduled;
        if (isScheduled !== undefined) broadcast.isScheduled = !!isScheduled;
        if (intervalDays !== undefined) broadcast.intervalDays = intervalDays;

        // If scheduling just got enabled or interval changed, reset nextFireAt
        if (broadcast.isScheduled) {
            if (!wasScheduled || intervalDays !== undefined) {
                const base = broadcast.lastSentAt || new Date();
                broadcast.nextFireAt = new Date(base.getTime() + broadcast.intervalDays * 24 * 60 * 60 * 1000);
            }
        } else {
            broadcast.nextFireAt = null;
        }

        await broadcast.save();
        res.json(broadcast);
    } catch (err) {
        console.error('[Broadcast] Update error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc  Delete a broadcast
// @route DELETE /api/broadcast/:id
// @access Private/Admin
const deleteBroadcast = async (req, res) => {
    try {
        const broadcast = await Broadcast.findByIdAndDelete(req.params.id);
        if (!broadcast) return res.status(404).json({ message: 'Not found' });
        console.log(`[Broadcast] Deleted "${broadcast.title}" by admin "${req.user.name}"`);
        res.json({ message: 'Deleted' });
    } catch (err) {
        console.error('[Broadcast] Delete error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc  Manually send a broadcast immediately to all subscribers
// @route POST /api/broadcast/:id/send
// @access Private/Admin
const sendBroadcastNow = async (req, res) => {
    try {
        const broadcast = await Broadcast.findById(req.params.id);
        if (!broadcast) return res.status(404).json({ message: 'Not found' });

        const ids = await getAllSubscriberIds();
        if (!ids.length) {
            return res.status(200).json({ message: 'No subscribers found', recipientCount: 0 });
        }

        await sendNotification(ids, broadcast.title, broadcast.message, { type: 'broadcast', broadcastId: broadcast._id.toString() });

        broadcast.sentAt = new Date();
        broadcast.lastSentAt = new Date();
        broadcast.lastRecipientCount = ids.length;
        if (broadcast.isScheduled) {
            broadcast.nextFireAt = new Date(Date.now() + broadcast.intervalDays * 24 * 60 * 60 * 1000);
        }
        await broadcast.save();

        console.log(`[Broadcast] Sent "${broadcast.title}" to ${ids.length} subscribers by admin "${req.user.name}"`);
        res.json({ message: 'Sent', recipientCount: ids.length });
    } catch (err) {
        console.error('[Broadcast] Send error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── Used by the cron scheduler ──────────────────────────────────────────────
const runScheduledBroadcasts = async () => {
    try {
        const now = new Date();
        const due = await Broadcast.find({
            isScheduled: true,
            nextFireAt: { $lte: now },
        });

        if (!due.length) return;
        const ids = await getAllSubscriberIds();

        for (const broadcast of due) {
            if (ids.length) {
                await sendNotification(ids, broadcast.title, broadcast.message, {
                    type: 'broadcast',
                    broadcastId: broadcast._id.toString(),
                });
                broadcast.lastRecipientCount = ids.length;
                console.log(`[Broadcast] Auto-sent "${broadcast.title}" to ${ids.length} subscribers`);
            }
            broadcast.lastSentAt = now;
            broadcast.nextFireAt = new Date(now.getTime() + broadcast.intervalDays * 24 * 60 * 60 * 1000);
            await broadcast.save();
        }
    } catch (err) {
        console.error('[Broadcast] Scheduler error:', err.message);
    }
};

module.exports = { getBroadcasts, createBroadcast, updateBroadcast, deleteBroadcast, sendBroadcastNow, runScheduledBroadcasts };
