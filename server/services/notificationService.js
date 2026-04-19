const axios = require('axios');

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

const sendNotification = async (playerIds, heading, message, data = {}) => {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    console.log('OneSignal not configured. Skipping notification.');
    return null;
  }

  if (!playerIds || playerIds.length === 0) {
    console.log('No player IDs provided. Skipping notification.');
    return null;
  }

  try {
    const response = await axios.post(
      'https://onesignal.com/api/v1/notifications',
      {
        app_id: ONESIGNAL_APP_ID,
        include_player_ids: playerIds,
        headings: { en: heading },
        contents: { en: message },
        data: data,
        priority: 10,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
        },
      }
    );
    return response.data;
  } catch (err) {
    console.error('OneSignal notification error:', err.response?.data || err.message);
    return null;
  }
};

const sendOrderNotificationToUser = async (user) => {
  if (!user.playerID || !user.notificationEnabled) {
    return null;
  }
  return sendNotification(
    [user.playerID],
    'Order Confirmed',
    'Your order has been placed successfully! We will update you on its progress.',
    { type: 'order_placed' }
  );
};

const sendOrderNotificationToAdmin = async (adminPlayerIds, order, userName) => {
  if (!adminPlayerIds || adminPlayerIds.length === 0) {
    return null;
  }
  const message = `New order from ${userName}. Total: ₹${order.totalPrice}. Check admin panel for details.`;
  return sendNotification(
    adminPlayerIds,
    'New Order Received!',
    message,
    { type: 'new_order', orderId: order._id.toString() }
  );
};

module.exports = {
  sendNotification,
  sendOrderNotificationToUser,
  sendOrderNotificationToAdmin,
};