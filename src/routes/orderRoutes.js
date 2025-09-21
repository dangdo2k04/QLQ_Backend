const express = require('express');
const { createOrder, getAllOrders, getMyOrders, getOrderById, updateOrderStatus } = require('../controllers/orderController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/', protect, createOrder); // Tạo đơn hàng
router.get('/myorders', protect, getMyOrders); // Lấy đơn hàng của người dùng hiện tại
router.get('/all', protect, authorize('admin'), getAllOrders); // Lấy tất cả đơn hàng (Admin)
router.get('/:id', protect, getOrderById); // Lấy chi tiết đơn hàng theo ID
router.put('/:id/status', protect, authorize('admin'), updateOrderStatus); // Cập nhật trạng thái đơn hàng (Admin)

module.exports = router;