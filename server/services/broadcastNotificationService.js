// Thin wrapper around OneSignal — used only for broadcast sends
// Keeps notificationService.js clean and avoids circular deps
const axios = require('axios');

const sendNotification = async (playerIds, heading, message, data = {}) => {
    const APP_ID = process.env.ONESIGNAL_APP_ID;
    const KEY = process.env.ONESIGNAL_REST_API_KEY;
    if (!APP_ID || !KEY || !playerIds?.length) return null;

    try {
        const res = await axios.post(
            'https://onesignal.com/api/v1/notifications',
            {
                app_id: APP_ID,
                include_player_ids: playerIds,
                headings: { en: heading },
                contents: { en: message },
                data,
                priority: 10,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Basic ${KEY}`,
                },
            }
        );
        return res.data;
    } catch (err) {
        console.error('[Broadcast] OneSignal error:', err.response?.data || err.message);
        return null;
    }
};

module.exports = { sendNotification };
