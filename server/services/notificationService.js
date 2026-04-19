const axios = require('axios');

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

console.log('[NotifService] ONESIGNAL_APP_ID:', ONESIGNAL_APP_ID ? 'set' : 'NOT SET');
console.log('[NotifService] ONESIGNAL_REST_API_KEY:', ONESIGNAL_REST_API_KEY ? 'set' : 'NOT SET');

const sendNotification = async (playerIds, heading, message, data = {}) => {
  console.log('[NotifService] sendNotification called:', { playerIds, heading, message });

  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    console.log('[NotifService] OneSignal not configured. Skipping notification.');
    return null;
  }

  if (!playerIds || playerIds.length === 0) {
    console.log('[NotifService] No player IDs provided. Skipping notification.');
    return null;
  }

  console.log('[NotifService] Sending notification to:', playerIds);

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
    console.log('[NotifService] Notification sent successfully:', response.data);
    return response.data;
  } catch (err) {
    console.error('[NotifService] OneSignal notification error:', err.response?.data || err.message);
    return null;
  }
};

const sendOrderNotificationToUser = async (user) => {
  console.log('[NotifService] sendOrderNotificationToUser:', { playerID: user?.playerID, notificationEnabled: user?.notificationEnabled });
  
  if (!user?.playerID || !user?.notificationEnabled) {
    console.log('[NotifService] User notifications disabled or no playerID. Skipping.');
    return null;
  }
  
  console.log('[NotifService] Sending order confirmation to user:', user.playerID);
  return sendNotification(
    [user.playerID],
    'Order Confirmed',
    'Your order has been placed successfully! We will update you on its progress.',
    { type: 'order_placed' }
  );
};

const sendOrderNotificationToAdmin = async (adminPlayerIds, order, userName) => {
  console.log('[NotifService] sendOrderNotificationToAdmin:', { adminPlayerIds, userName, orderId: order?._id });
  
  if (!adminPlayerIds || adminPlayerIds.length === 0) {
    console.log('[NotifService] No admin playerIDs. Skipping admin notification.');
    return null;
  }
  
  const message = `New order from ${userName}. Total: ₹${order.totalPrice}. Check admin panel for details.`;
  console.log('[NotifService] Sending new order notification to admins:', adminPlayerIds);
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