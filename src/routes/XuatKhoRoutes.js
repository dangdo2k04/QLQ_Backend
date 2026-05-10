const express = require('express');
const router = express.Router();
const xuatKhoController = require('../controllers/XuatKhoController');
const { baoVe, phanQuyen } = require('../middlewares/authMiddleware');

router.put('/xac-nhan/:id', baoVe, phanQuyen('admin', 'nhanvien_kho'), xuatKhoController.xacNhanXuatKho);
router.get('/xuat-excel/:id', baoVe, phanQuyen('admin', 'nhanvien_kho'), xuatKhoController.xuatExcelPhieuXuat);
router.get('/', baoVe, phanQuyen('admin', 'nhanvien_kho'), xuatKhoController.layTatCaPhieuXuat);
module.exports = router;