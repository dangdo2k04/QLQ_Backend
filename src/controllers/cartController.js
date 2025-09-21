// server/src/controllers/cartController.js
const Cart = require('../models/Cart');

// @desc    Get user's cart
// @route   GET /api/v1/cart
// @access  Private
exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart) {
      return res.status(200).json({ success: true, items: [] });
    }
    res.status(200).json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Lỗi server' });
  }
};

// @desc    Add product to cart
// @route   POST /api/v1/cart
// @access  Private
exports.addItemToCart = async (req, res) => {
  const { productId, quantity } = req.body;
  try {
    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = await Cart.create({
        user: req.user._id,
        items: [{ product: productId, quantity }],
      });
    } else {
      const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += quantity;
      } else {
        cart.items.push({ product: productId, quantity });
      }
    }

    await cart.save();
    await cart.populate('items.product'); // Populate để gửi thông tin chi tiết sản phẩm
    res.status(201).json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Lỗi server' });
  }
};

exports.updateCartItem = async (req, res) => {
  const { quantity } = req.body;
  const { id } = req.params; // id của sản phẩm trong giỏ hàng (item._id)

  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy giỏ hàng' });
    }

    const item = cart.items.id(id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm trong giỏ hàng' });
    }

    item.quantity = quantity;
    await cart.save();
    await cart.populate('items.product');
    res.status(200).json({ success: true, cart });

  } catch (error) {
    res.status(500).json({ success: false, error: 'Lỗi server' });
  }
};

// @desc    Remove a product from cart
// @route   DELETE /api/v1/cart/:id
// @access  Private
exports.removeCartItem = async (req, res) => {
  const { id } = req.params; // id của sản phẩm trong giỏ hàng (item._id)

  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy giỏ hàng' });
    }

    // Sử dụng pull() để xóa item ra khỏi mảng items
    cart.items.pull(id);
    await cart.save();
    await cart.populate('items.product');
    res.status(200).json({ success: true, cart });

  } catch (error) {
    res.status(500).json({ success: false, error: 'Lỗi server' });
  }
};