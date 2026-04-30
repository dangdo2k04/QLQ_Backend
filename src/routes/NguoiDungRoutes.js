const express = require('express');
const { 
    dangKy, 
    dangNhap, 
    layTatCaNguoiDung, 
    layProfile, 
    capNhatMe, 
    xoaNguoiDung, 
    doiMatKhau,
    layChiTietNguoiDung,
    capNhatNguoiDung
} = require('../controllers/NguoiDungController');

const { baoVe, phanQuyen } = require('../middlewares/authMiddleware');

const router = express.Router();

// --- Các tuyến đường Công khai (Public) ---
router.post('/dang-ky', dangKy);
router.post('/dang-nhap', dangNhap);

// --- Các tuyến đường cần Đăng nhập (Private) ---
router.use(baoVe); // Tất cả các route bên dưới dòng này đều cần Token

router.get('/me', layProfile);
router.put('/me', capNhatMe);
router.put('/doi-mat-khau', doiMatKhau);

// --- Các tuyến đường dành riêng cho Quản trị viên (Admin Only) ---
router.use(phanQuyen('admin'));

router.route('/quan-ly')
    .get(layTatCaNguoiDung);

router.route('/quan-ly/:id')
    .get(layChiTietNguoiDung)
    .delete(xoaNguoiDung);
router.put('/quan-ly/:id', capNhatNguoiDung); // Admin có thể cập nhật thông tin người dùng khác

module.exports = router;