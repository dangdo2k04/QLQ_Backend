const express = require('express');
const router = express.Router();
const { layThongKeTongQuan, xuatExcelKho, layDuLieuBieuDo } = require('../controllers/BaoCaoController');
const { baoVe, phanQuyen } = require('../middlewares/authMiddleware');

router.use(baoVe);
router.use(phanQuyen('admin'));

router.get('/tong-quan', layThongKeTongQuan);
router.get('/xuat-excel-kho', xuatExcelKho);
router.get('/bieu-do', layDuLieuBieuDo);

module.exports = router;