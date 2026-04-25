const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const User = require('../models/User');
const mongoose = require('mongoose');

exports.createOrder = async (req, res) => {
  const { items } = req.body; // items: [{ product: productId, quantity: number }, ...]

  // Kiểm tra items
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Danh sách items không hợp lệ hoặc trống.' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    let totalAmount = 0;
    const orderItems = [];

    // Lặp qua items để kiểm tra tồn kho và tính tổng giá
    for (const item of items) {
      if (!item || typeof item !== 'object' || !item.product || !item.quantity) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ success: false, message: 'Cấu trúc item không hợp lệ.' });
      }
      const product = await Product.findById(item.product).session(session);
      if (!product) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ success: false, message: `Sản phẩm ${item.product} không tồn tại.` });
      }
      if (product.inventory < item.quantity || item.quantity <= 0) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: `Sản phẩm ${product.name} chỉ còn ${product.inventory} trong kho hoặc số lượng không hợp lệ.`
        });
      }
      totalAmount += product.price * item.quantity;
      orderItems.push({ product: item.product, quantity: item.quantity });
    }

    // Giảm tồn kho
    for (const item of items) {
      await Product.updateOne(
        { _id: item.product, inventory: { $gte: item.quantity } },
        { $inc: { inventory: -item.quantity } },
        { session }
      );
    }

    // Tạo đơn hàng
    const order = new Order({
      user: req.user._id,
      items: orderItems,
      totalAmount,
      status: 'pending',
    });
    await order.save({ session });

    // Xóa các item đã đặt hàng khỏi giỏ hàng
    const cart = await Cart.findOne({ user: req.user._id }).session(session);
    if (cart) {
      cart.items = cart.items.filter(cartItem => {
        return !items.some(orderItem => orderItem.product.toString() === cartItem.product.toString() && orderItem.quantity === cartItem.quantity);
      });
      await cart.save({ session });
    }

    await session.commitTransaction();
    session.endSession();
    console.log('Order created and cart updated:', order);
    res.status(201).json({ success: true, order });
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error in createOrder:', e.stack);
    res.status(500).json({ success: false, error: 'Lỗi server' });
  }
};

// @desc    Lấy tất cả đơn hàng (Admin)
// @route   GET /api/v1/orders/all
// @access  Private/Admin
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate('user', 'name email phone address').populate('items.product', 'name price');
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
    const orders = await Order.find({ user: req.user._id }).populate('items.product', 'name price images').populate('user', 'name address phone');;
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
    const order = await Order.findById(req.params.id).populate('user', 'name email phone address').populate('items.product', 'name price images');

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