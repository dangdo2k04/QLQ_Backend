const express = require('express');
const { 
  taoPhieuNhap, 
  layTatCaPhieuNhap, 
  layChiTietPhieuNhap,
  xuatExcelPhieuNhap 
} = require('../controllers/PhieuNhapController');

const { baoVe, phanQuyen } = require('../middlewares/authMiddleware');

const router = express.Router();

// Tất cả các thao tác nhập kho đều cần bảo mật
router.use(baoVe);

// Chỉ Admin và Nhân viên kho mới được phép thao tác
router.use(phanQuyen('admin', 'nhanvien_kho'));
router.get('/:id/xuat-excel', xuatExcelPhieuNhap);
router.route('/')
  .post(taoPhieuNhap)
  .get(layTatCaPhieuNhap);

router.get('/:id', layChiTietPhieuNhap);


module.exports = router;