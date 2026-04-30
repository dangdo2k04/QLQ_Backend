const express = require('express');
const { 
  layTatCaSanPham, 
  taoSanPham, 
  layChiTietSanPham, 
  capNhatSanPham, 
  xoaSanPham,
  layCanhBaoTonKho
} = require('../controllers/SanPhamController');

const { baoVe, phanQuyen } = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * --- TUYẾN ĐƯỜNG CÔNG KHAI (PUBLIC) ---
 */
// Lấy danh sách sản phẩm (Phân trang, lọc, tìm kiếm)
router.get('/', layTatCaSanPham);

// Lấy chi tiết một sản phẩm
router.get('/:id', layChiTietSanPham);


/**
 * --- TUYẾN ĐƯỜNG NỘI BỘ (PRIVATE) ---
 * Yêu cầu đăng nhập và phân quyền
 */
router.use(baoVe); // Tất cả các route bên dưới cần Token

// Route dành cho cả Admin và Nhân viên Kho
router.get('/he-thong/canh-bao-ton-kho', phanQuyen('admin', 'nhanvien_kho'), layCanhBaoTonKho);
router.post('/', phanQuyen('admin', 'nhanvien_kho'), taoSanPham); // Chỉ Admin và Nhân viên Kho mới có quyền thêm sản phẩm

// Tuyến đường dành riêng cho Quản trị viên (Admin Only)
router.use(phanQuyen('admin'));


router.route('/:id')
  .put(capNhatSanPham)
  .delete(xoaSanPham);

module.exports = router;