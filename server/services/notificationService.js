const axios = require('axios');

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

// ─── Core send helper ───────────────────────────────────────────────────────
const sendNotification = async (playerIds, heading, message, data = {}) => {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) return null;
  if (!playerIds || playerIds.length === 0) return null;

  try {
    const response = await axios.post(
      'https://onesignal.com/api/v1/notifications',
      {
        app_id: ONESIGNAL_APP_ID,
        include_player_ids: playerIds,
        headings: { en: heading },
        contents: { en: message },
        data,
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
    console.error('[Notif] OneSignal API error:', err.response?.data || err.message);
    return null;
  }
};

// ─── Collect all unique, non-empty player IDs for a user ───────────────────
const getUserPlayerIds = (user) => {
  const set = new Set();
  if (user.playerID) set.add(user.playerID);
  if (Array.isArray(user.playerIDs)) user.playerIDs.forEach((id) => { if (id) set.add(id); });
  return Array.from(set);
};

// ─── Order placed → user ───────────────────────────────────────────────────
const sendOrderPlacedToUser = async (user) => {
  if (!user?.notificationEnabled) return null;
  const ids = getUserPlayerIds(user);
  if (!ids.length) return null;
  return sendNotification(ids, 'Order Confirmed \u2705', "Your order has been placed! We'll keep you updated on its progress.", { type: 'order_placed' });
};

// ─── Order placed → admin ──────────────────────────────────────────────────
const sendOrderPlacedToAdmin = async (adminPlayerIds, order, userName) => {
  if (!adminPlayerIds?.length) return null;
  return sendNotification(
    adminPlayerIds,
    'New Order Received 🛍️',
    `${userName} placed an order — ₹${order.totalPrice}. Check admin panel.`,
    { type: 'new_order', orderId: order._id.toString() }
  );
};

// ─── Order cancelled → user ────────────────────────────────────────────────
const sendOrderCancelledToUser = async (user) => {
  if (!user?.notificationEnabled) return null;
  const ids = getUserPlayerIds(user);
  if (!ids.length) return null;
  return sendNotification(ids, 'Order Cancelled ❌', 'Your order has been cancelled. If this was a mistake, please place a new order.', { type: 'order_cancelled' });
};

// ─── Order cancelled → admin ───────────────────────────────────────────────
const sendOrderCancelledToAdmin = async (adminPlayerIds, order, userName) => {
  if (!adminPlayerIds?.length) return null;
  return sendNotification(
    adminPlayerIds,
    'Order Cancelled ⚠️',
    `${userName} cancelled an order — ₹${order.totalPrice}. Review admin panel.`,
    { type: 'order_cancelled', orderId: order._id.toString() }
  );
};

// ─── Order status update → user (only meaningful milestones) ───────────────
const STATUS_MESSAGES = {
  accepted: {
    heading: 'Order Accepted 👍',
    body: 'Great news! Your order has been accepted and is being prepared.',
  },
  outForDelivery: {
    heading: 'Out for Delivery 🚚',
    body: 'Your order is on its way! Expect delivery soon.',
  },
  delivered: {
    heading: 'Delivered 🎉',
    body: 'Your order has been delivered. Enjoy your purchase!',
  },
};

const sendOrderStatusUpdateToUser = async (user, status) => {
  const template = STATUS_MESSAGES[status];
  if (!template) return null; // Skip inProcess, pending — not worth notifying
  if (!user?.notificationEnabled) return null;
  const ids = getUserPlayerIds(user);
  if (!ids.length) return null;
  return sendNotification(ids, template.heading, template.body, { type: 'order_status', status });
};

module.exports = {
  sendOrderPlacedToUser,
  sendOrderPlacedToAdmin,
  sendOrderCancelledToUser,
  sendOrderCancelledToAdmin,
  sendOrderStatusUpdateToUser,
};