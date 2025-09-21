// server/src/controllers/orderController.js
const Order = require('../models/Order');
const Cart = require('../models/Cart');

// @desc    Tạo đơn hàng từ giỏ hàng
// @route   POST /api/v1/orders
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Giỏ hàng của bạn đang trống' });
    }

    const totalAmount = cart.items.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

    const newOrder = await Order.create({
      user: req.user._id,
      items: cart.items,
      totalAmount,
    });

    // Xóa giỏ hàng sau khi tạo đơn hàng thành công
    await Cart.findOneAndDelete({ user: req.user._id });

    res.status(201).json({ success: true, order: newOrder });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Lỗi server' });
  }
};

// @desc    Lấy tất cả đơn hàng (Admin)
// @route   GET /api/v1/orders/all
// @access  Private/Admin
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate('user', 'name email').populate('items.product', 'name price');
    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Lỗi server' });
  }
};

// @desc    Lấy tất cả đơn hàng của một người dùng
// @route   GET /api/v1/orders/myorders
// @access  Private
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).populate('items.product', 'name price');
    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Lỗi server' });
  }
};

// @desc    Lấy chi tiết đơn hàng theo ID
// @route   GET /api/v1/orders/:id
// @access  Private
exports.getOrderById = async (req, res) => {
  try {
    console.log('Fetching order with id:', req.params.id, 'for user:', req.user._id, 'with role:', req.user.role);
    const order = await Order.findById(req.params.id).populate('user', 'name email').populate('items.product', 'name price');

    if (!order) {
      console.log('Order not found with id:', req.params.id);
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    console.log('Order found:', order);
    // Kiểm tra quyền: chỉ cho phép user xem đơn hàng của chính họ hoặc admin xem tất cả
    console.log('order.user._id:', order.user._id, 'type:', typeof order.user._id);
    console.log('req.user._id:', req.user._id, 'type:', typeof req.user._id);
    const isOwner = order.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    console.log('isOwner:', isOwner, 'isAdmin:', isAdmin);
    if (!isOwner && !isAdmin) {
      console.log('Permission denied for user:', req.user._id);
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xem đơn hàng này' });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error('Error fetching order by id:', error);
    res.status(500).json({ success: false, error: 'Lỗi server' });
  }
};

// @desc    Cập nhật trạng thái đơn hàng (Admin)
// @route   PUT /api/v1/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    order.status = status;
    await order.save();
    res.status(200).json({ success: true, order });

  } catch (error) {
    res.status(500).json({ success: false, error: 'Lỗi server' });
  }
};