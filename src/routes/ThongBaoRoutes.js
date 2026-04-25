const express = require('express');
const { 
    layThongBaoCuaToi, 
    danhDauDaXem, 
    xoaThongBao 
} = require('../controllers/ThongBaoController');

const { baoVe } = require('../middlewares/authMiddleware');

const router = express.Router();

// --- TẤT CẢ ROUTE THÔNG BÁO ĐỀU CẦN ĐĂNG NHẬP ---
router.use(baoVe);

/**
 * @route   GET /api/v1/thong-bao
 * @desc    Lấy tất cả thông báo của người dùng hiện tại (hoặc thông báo hệ thống cho Admin)
 */
router.get('/', layThongBaoCuaToi);

/**
 * @route   PUT /api/v1/thong-bao/:id/da-xem
 * @desc    Đánh dấu một thông báo là đã đọc
 */
router.put('/:id/da-xem', danhDauDaXem);

/**
 * @route   DELETE /api/v1/thong-bao/:id
 * @desc    Xóa một thông báo khỏi danh sách
 */
router.delete('/:id', xoaThongBao);

module.exports = router;