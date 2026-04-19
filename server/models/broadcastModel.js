const mongoose = require('mongoose');

const broadcastSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        message: { type: String, required: true, trim: true },
        // For manual one-off broadcasts
        sentAt: { type: Date, default: null },
        // For scheduled auto-broadcasts
        isScheduled: { type: Boolean, default: false },
        intervalDays: {
            type: Number,
            enum: [3, 5, 7],
            default: 3,
        },
        // Next fire time (calculated from lastSentAt + intervalDays)
        nextFireAt: { type: Date, default: null },
        lastSentAt: { type: Date, default: null },
        // How many users received it last time
        lastRecipientCount: { type: Number, default: 0 },
    },
    { timestamps: true }
);

const Broadcast = mongoose.model('Broadcast', broadcastSchema);
module.exports = Broadcast;
