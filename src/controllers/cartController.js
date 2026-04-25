// server/src/controllers/cartController.js
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const mongoose = require('mongoose'); 

// @desc    Get user's cart
// @route   GET /api/v1/cart
// @access  Private
exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart) {
      return res.status(200).json({ success: true, items: [] });
    }
    const totalProducts = cart.items.length;
    const totalQuantity = cart.items.reduce((acc, item) => acc + item.quantity, 0);
    res.status(200).json({ success: true, cart, totalProducts, totalQuantity });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Lỗi server' });
  }
};

// @desc    Add product to cart
// @route   POST /api/v1/cart
// @access  Private
exports.addItemToCart = async (req, res) => {
  const { productId, quantity } = req.body;
  return new Promise(async (resolve, reject) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return reject({ status: 'ERR', message: 'ID sản phẩm không hợp lệ.' });
      }
      if (quantity <= 0) {
        return reject({ status: 'ERR', message: 'Số lượng phải lớn hơn 0.' });
      }

      const product = await Product.findById(productId);
      if (!product) {
        return reject({ status: 'ERR', message: 'Sản phẩm không tồn tại.' });
      }
      if (product.inventory < quantity) {
        return reject({
          status: 'ERR',
          message: `Sản phẩm ${product.name} chỉ còn ${product.inventory} trong kho.`
        });
      }

      let cart = await Cart.findOne({ user: req.user._id });
      if (!cart) {
        cart = new Cart({ user: req.user._id, items: [] });
      }

      const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += quantity;
        if (cart.items[itemIndex].quantity > product.inventory) {
          return reject({
            status: 'ERR',
            message: `Số lượng yêu cầu vượt quá tồn kho (${product.inventory}).`
          });
        }
      } else {
        cart.items.push({ product: productId, quantity });
      }

      await cart.save();
      await cart.populate('items.product');
      console.log('Cart updated:', cart);
      resolve({ status: 'OK', message: 'Thêm vào giỏ hàng thành công', data: cart });
      res.status(201).json({ success: true, cart });
    } catch (e) {
      console.error('Error in addItemToCart:', e.stack);
      reject({ status: 'ERR', message: 'Lỗi server khi thêm vào giỏ hàng.', error: e.message });
      res.status(500).json({ success: false, error: 'Lỗi server' });
    }
  });
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