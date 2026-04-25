const express = require('express');
const { layLichSuBienDongSanPham, layTatCaNhatKy } = require('../controllers/NhatKyKhoController');
const { baoVe, phanQuyen } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(baoVe);
router.use(phanQuyen('admin', 'nhanvien_kho'));

router.get('/', layTatCaNhatKy);
router.get('/san-pham/:id', layLichSuBienDongSanPham);

module.exports = router;