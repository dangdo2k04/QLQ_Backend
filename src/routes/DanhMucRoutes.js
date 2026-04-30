const express = require('express');
const {
  layTatCaDanhMuc,
  layDanhMucTheoId,
  taoDanhMuc,
  capNhatDanhMuc,
  xoaDanhMuc,
  laySanPhamTheoDanhMuc
} = require('../controllers/DanhMucController');

const { baoVe, phanQuyen } = require('../middlewares/authMiddleware');

const router = express.Router();

// --- Tuyến đường Công khai (Public) ---
// Cho phép cả khách hàng và nhân viên xem danh mục sản phẩm
router.get('/', layTatCaDanhMuc);
router.get('/:id', layDanhMucTheoId);
router.get('/:id/san-pham', laySanPhamTheoDanhMuc);
router.use(baoVe);
router.post('/', phanQuyen('admin', 'nhanvien_kho'),taoDanhMuc);

// --- Tuyến đường Quản trị (Admin Only) ---
// Chỉ Admin mới có quyền thay đổi cấu trúc danh mục hàng hóa
router.use(phanQuyen('admin'));

router.route('/:id')
  .put(capNhatDanhMuc)
  .delete(xoaDanhMuc);

module.exports = router;