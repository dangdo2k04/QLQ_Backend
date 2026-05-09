const express = require('express');
const { 
    taoDonHang, 
    layTatCaDonHang, 
    layDonHangCuaToi, 
    layChiTietDonHang, 
    capNhatTrangThai,
    huyDonHang,
    kiemTraDonHang
} = require('../controllers/DonHangController');

const { baoVe, phanQuyen } = require('../middlewares/authMiddleware');

const router = express.Router();

// --- TẤT CẢ CÁC ROUTE ĐƠN HÀNG ĐỀU CẦN ĐĂNG NHẬP ---
router.use(baoVe);

// Tuyến đường cho Khách hàng & Nhân viên
router.post('/kiem-tra', kiemTraDonHang);
router.post('/', taoDonHang); // Đặt hàng
router.get('/lich-su-mua-hang', layDonHangCuaToi); // Xem đơn của chính mình
router.get('/:id', layChiTietDonHang); 
 // Kiểm tra đơn hàng trước khi đặt
// Xem chi tiết đơn (Có check chủ sở hữu trong controller)
router.delete('/:id',phanQuyen(''), huyDonHang); // Hủy đơn hàng (Chỉ khách hàng mới có quyền này)

// Tuyến đường dành riêng cho Quản trị viên & Nhân viên kho (Admin/Staff Only)
router.use(phanQuyen('admin', 'nhanvien_kho'));

router.get('/he-thong/tat-ca', layTatCaDonHang); // Xem toàn bộ đơn hàng hệ thống
router.put('/:id/trang-thai', capNhatTrangThai); // Cập nhật trạng thái (Chờ xác nhận -> Đang giao...)

module.exports = router;