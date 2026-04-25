const ThongBao = require('../models/ThongBao');

// @desc    Lấy danh sách thông báo của người dùng hiện tại
// @route   GET /api/v1/thong-bao
exports.layThongBaoCuaToi = async (req, res) => {
  try {
    // Admin xem thông báo hệ thống/tồn kho, Khách xem thông báo đơn hàng của họ
    const truyVan = {
      $or: [
        { nguoiNhan: req.user.id },
        { nguoiNhan: null } // Thông báo chung cho hệ thống (Admin)
      ]
    };

    const thongBaos = await ThongBao.find(truyVan)
      .sort('-createdAt')
      .limit(50); // Chỉ lấy 50 thông báo mới nhất

    res.status(200).json({
      success: true,
      soLuong: thongBaos.length,
      duLieu: thongBaos
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
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