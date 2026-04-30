const DonHang = require('../models/DonHang');
const SanPham = require('../models/SanPham');
const NhatKyKho = require('../models/NhatKyKho');
const mongoose = require('mongoose');

// @desc    Xác nhận đơn hàng và thực hiện xuất kho
// @route   PUT /api/v1/xuat-kho/xac-nhan/:id
// @access  Riêng tư/NhanVienKho/Admin
exports.xacNhanXuatKho = async (req, res) => {
  try {
    const { id } = req.params;
    const donHang = await DonHang.findById(id);

    if (!donHang) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    
    // Chỉ xác nhận nếu đơn hàng đang chờ
    if (donHang.trangThaiDonHang !== 'ChoXacNhan') {
      return res.status(400).json({ success: false, message: 'Đơn hàng không ở trạng thái chờ xác nhận' });
    }

    // CHỈ CẬP NHẬT TRẠNG THÁI (Vì kho đã trừ lúc đặt hàng)
    donHang.trangThaiDonHang = 'DangGiao';
    // Bạn có thể thêm trường nhanVienKho xử lý để biết ai đã đóng gói
    donHang.nhanVienKho = req.user._id; 
    
    await donHang.save();

    res.status(200).json({ success: true, message: 'Xác nhận đơn hàng thành công, bắt đầu giao hàng' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};