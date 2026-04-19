const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const User = require('../models/userModel');
const {
  sendOrderPlacedToUser,
  sendOrderPlacedToAdmin,
  sendOrderCancelledToUser,
  sendOrderCancelledToAdmin,
  sendOrderStatusUpdateToUser,
} = require('../services/notificationService');
const { getSettings } = require('../models/appSettingsModel');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = async (req, res) => {
  try {
    const { orderItems, shippingAddress, paymentMethod, totalPrice } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    }

    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.name}` });
      }
      if (product.countInStock < item.qty) {
        return res.status(400).json({ message: `Insufficient stock for: ${product.name}` });
      }
      product.countInStock -= item.qty;
      await product.save();
    }

    const order = new Order({
      orderItems,
      user: req.user._id,
      shippingAddress,
      paymentMethod,
      totalPrice,
      orderStatus: 'pending',
      isPaid: paymentMethod !== 'COD',
      paidAt: paymentMethod !== 'COD' ? Date.now() : undefined,
    });

    const createdOrder = await order.save();
    console.log(`[Order] New order #${createdOrder._id} placed by "${req.user.name}" (${req.user.email}) — ₹${totalPrice} via ${paymentMethod}`);

    const user = await User.findById(req.user._id);

    // Fire-and-forget notifications
    sendOrderPlacedToUser(user).catch((err) =>
      console.error(`[Order] User notification failed for order ${createdOrder._id}:`, err.message)
    );

    const settings = await getSettings();
    if (settings.adminPlayerIDs?.length) {
      sendOrderPlacedToAdmin(settings.adminPlayerIDs, createdOrder, user.name).catch((err) =>
        console.error(`[Order] Admin notification failed for order ${createdOrder._id}:`, err.message)
      );
    }

    // Update user's saved shipping address
    try {
      const { phone, address, city, postalCode, state, country } = shippingAddress;
      await User.findByIdAndUpdate(req.user._id, {
        ...(phone && { phone }),
        ...(address && { address }),
        ...(city && { city }),
        ...(postalCode && { postalCode }),
        ...(state && { state }),
        ...(country && { country }),
      });
    } catch (err) {
      console.error('[Order] Could not update user address:', err.message);
    }

    res.status(201).json(createdOrder);
  } catch (err) {
    console.error('[Order] Order creation error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (err) {
    console.error('[Order] Get order error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (order) {
      order.isPaid = true;
      order.paidAt = Date.now();
      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (err) {
    console.error('[Order] Update order paid error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update order status (admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['pending', 'accepted', 'inProcess', 'outForDelivery', 'delivered', 'cancelled'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const prevStatus = order.orderStatus;
    order.orderStatus = status;

    if (status === 'delivered') {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
    }

    const updatedOrder = await order.save();
    console.log(`[Order] Status updated: order #${order._id} → "${status}" (was "${prevStatus}") by admin "${req.user.name}"`);

    // Notify user on key milestones; skip inProcess / pending (not worth notifying)
    const user = await User.findById(order.user);
    if (user) {
      sendOrderStatusUpdateToUser(user, status).catch((err) =>
        console.error(`[Order] Status notification failed (order ${order._id}, status ${status}):`, err.message)
      );

      // Also notify admins when admin cancels an order
      if (status === 'cancelled') {
        const settings = await getSettings();
        if (settings.adminPlayerIDs?.length) {
          sendOrderCancelledToAdmin(settings.adminPlayerIDs, order, user.name).catch((err) =>
            console.error(`[Order] Admin cancel notification failed (order ${order._id}):`, err.message)
          );
        }
        sendOrderCancelledToUser(user).catch((err) =>
          console.error(`[Order] User cancel notification failed (order ${order._id}):`, err.message)
        );
      }
    }

    res.json(updatedOrder);
  } catch (err) {
    console.error('[Order] Update order status error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error('[Order] Get my orders error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all orders (admin)
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'name email')
      .populate('orderItems.product', 'image images')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error('[Order] Get orders error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Cancel order (customer — only if pending/accepted)
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorised' });
    }

    if (!['pending', 'accepted'].includes(order.orderStatus)) {
      return res.status(400).json({ message: 'Order cannot be cancelled at this stage' });
    }

    // Restore stock
    for (const item of order.orderItems) {
      const product = await Product.findById(item.product);
      if (product) {
        product.countInStock += item.qty;
        await product.save();
      }
    }

    order.orderStatus = 'cancelled';
    const updated = await order.save();
    console.log(`[Order] Order #${order._id} cancelled by user "${req.user.name}" (${req.user.email})`);

    // Notify user
    const user = await User.findById(req.user._id);
    if (user) {
      sendOrderCancelledToUser(user).catch((err) =>
        console.error(`[Order] User cancel notification failed (order ${order._id}):`, err.message)
      );
    }

    // Notify admins
    const settings = await getSettings();
    if (settings.adminPlayerIDs?.length && user) {
      sendOrderCancelledToAdmin(settings.adminPlayerIDs, order, user.name).catch((err) =>
        console.error(`[Order] Admin cancel notification failed (order ${order._id}):`, err.message)
      );
    }

    res.json(updated);
  } catch (err) {
    console.error('[Order] Cancel order error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update order to delivered (legacy compat)
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
const updateOrderToDelivered = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (order) {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
      order.orderStatus = 'delivered';
      const updatedOrder = await order.save();
      console.log(`[Order] Order #${order._id} marked delivered by admin "${req.user.name}"`);

      const user = await User.findById(order.user);
      if (user) {
        sendOrderStatusUpdateToUser(user, 'delivered').catch((err) =>
          console.error(`[Order] Delivered notification failed (order ${order._id}):`, err.message)
        );
      }

      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (err) {
    console.error('[Order] Update order delivered error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  addOrderItems,
  getOrderById,
  updateOrderToPaid,
  updateOrderStatus,
  updateOrderToDelivered,
  cancelOrder,
  getMyOrders,
  getOrders,
};
