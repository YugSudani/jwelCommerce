const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const User = require('../models/userModel');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = async (req, res) => {
  const { orderItems, shippingAddress, paymentMethod, totalPrice } = req.body;

  if (!orderItems || orderItems.length === 0) {
    return res.status(400).json({ message: 'No order items' });
  }

  // Reduce countInStock for each product
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
    isPaid: paymentMethod !== 'COD', // Mark paid immediately for UPI/Card
    paidAt: paymentMethod !== 'COD' ? Date.now() : undefined,
  });

  const createdOrder = await order.save();

  // Save shipping info back to the user's profile (upsert, non-blocking)
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
    // Non-fatal — order is already created, log and continue
    console.error('Could not update user address:', err.message);
  }

  res.status(201).json(createdOrder);
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (order) {
    res.json(order);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (order) {
    order.isPaid = true;
    order.paidAt = Date.now();
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};

// @desc    Update order status (admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  const allowedStatuses = ['pending', 'accepted', 'inProcess', 'outForDelivery', 'delivered', 'cancelled'];


  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  order.orderStatus = status;

  // Keep legacy fields in sync
  if (status === 'delivered') {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
  }

  const updatedOrder = await order.save();
  res.json(updatedOrder);
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
};

// @desc    Get all orders (admin)
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = async (req, res) => {
  const orders = await Order.find({})
    .populate('user', 'name email')
    .populate('orderItems.product', 'image images')
    .sort({ createdAt: -1 });
  res.json(orders);
};

// @desc    Cancel order (customer — only if pending)
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });

  // Only allow owner to cancel
  if (order.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorised' });
  }

  // Can only cancel if still pending or accepted
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
  res.json(updated);
};

// @desc    Update order to delivered (legacy compat)
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
const updateOrderToDelivered = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (order) {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
    order.orderStatus = 'delivered';
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404).json({ message: 'Order not found' });
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
