const express = require('express');
const { 
  layGioHang, 
  themSanPhamVaoGio, 
  capNhatSoLuongItem, 
  xoaSanPhamKhoiGio 
} = require('../controllers/GioHangController');
const { baoVe } = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * TẤT CẢ CÁC TUYẾN ĐƯỜNG GIỎ HÀNG ĐỀU CẦN ĐĂNG NHẬP
 * Sử dụng router.use(baoVe) để tránh lặp lại ở từng dòng
 */
router.use(baoVe);

// Lấy giỏ hàng của người dùng hiện tại
router.get('/', layGioHang);

// Thêm sản phẩm vào giỏ hàng
router.post('/', themSanPhamVaoGio);

// Cập nhật số lượng của một mục trong giỏ hàng (sử dụng ID của mục đó)
router.put('/:id', capNhatSoLuongItem);

// Xóa một sản phẩm khỏi giỏ hàng
router.delete('/:id', xoaSanPhamKhoiGio);

module.exports = router;