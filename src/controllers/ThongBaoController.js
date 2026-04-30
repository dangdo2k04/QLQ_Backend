const ThongBao = require('../models/ThongBao');

// @desc    Lấy danh sách thông báo của người dùng hiện tại
// @route   GET /api/v1/thong-bao
exports.layThongBaoCuaToi = async (req, res) => {
  try {
    let truyVan = {};

    // 1. Phân quyền truy vấn
    if (req.user.vaiTro === 'admin' || req.user.vaiTro === 'nhanvien_kho') {
      // Quản lý: Thấy thông báo Đích danh của mình + Thông báo TonKho + Thông báo HeThong chung
      truyVan = {
        $or: [
          { nguoiNhan: req.user.id }, // Thông báo riêng
          { loaiThongBao: 'TonKho' },   // Thông báo kho hàng
          { loaiThongBao: 'HeThong', nguoiNhan: null } // Thông báo hệ thống chung
        ]
      };
    } else {
      // Khách hàng: CHỈ thấy thông báo liên quan đến DonHang của chính họ
      // Hoặc thông báo HeThong nếu bạn gửi đích danh cho họ
      truyVan = { 
        nguoiNhan: req.user.id,
        loaiThongBao: 'DonHang' // Đảm bảo khách không thấy thông báo TonKho
      };
    }

    const thongBaos = await ThongBao.find(truyVan)
      .sort('-createdAt')
      .limit(50);

    res.status(200).json({
      success: true,
      soLuong: thongBaos.length,
      duLieu: thongBaos
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi lấy thông báo' });
  }
};

// @desc    Đánh dấu thông báo đã xem
// @route   PUT /api/v1/thong-bao/:id/da-xem
exports.danhDauDaXem = async (req, res) => {
  try {
    const thongBao = await ThongBao.findByIdAndUpdate(
      req.params.id,
      { daXem: true },
      { new: true }
    );

    if (!thongBao) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông báo' });
    }

    res.status(200).json({ success: true, duLieu: thongBao });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

// @desc    Xóa thông báo cũ
exports.xoaThongBao = async (req, res) => {
  try {
    await ThongBao.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Đã xóa thông báo' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};