const express = require('express');
const { getCart, addItemToCart, updateCartItem, removeCartItem } = require('../controllers/cartController');
const { protect } = require('../middlewares/authMiddleware'); // Đảm bảo bạn đã import middleware này
const router = express.Router();

// Route lấy giỏ hàng của người dùng hiện tại
router.get('/', protect, getCart);

// Route thêm sản phẩm vào giỏ hàng
router.post('/', protect, addItemToCart);

// Route để cập nhật số lượng sản phẩm trong giỏ hàng
router.put('/:id', protect, updateCartItem);

// Route để xóa sản phẩm khỏi giỏ hàng
router.delete('/:id', protect, removeCartItem);

module.exports = router;