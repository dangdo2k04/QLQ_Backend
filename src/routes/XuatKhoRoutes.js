const express = require('express');
const router = express.Router();
const xuatKhoController = require('../controllers/XuatKhoController');
const { baoVe, phanQuyen } = require('../middlewares/authMiddleware');

router.put('/xac-nhan/:id', baoVe, phanQuyen('admin', 'nhanvien_kho'), xuatKhoController.xacNhanXuatKho);
module.exports = router;