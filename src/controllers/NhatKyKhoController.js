const NhatKyKho = require('../models/NhatKyKho');
const SanPham = require('../models/SanPham');

// @desc    Lấy lịch sử biến động của một sản phẩm cụ thể
// @route   GET /api/v1/nhat-ky-kho/san-pham/:id
// @access  Riêng tư/Admin/NhanVienKho
exports.layLichSuBienDongSanPham = async (req, res) => {
  try {
    const { id } = req.params; // Đây là ObjectId của sản phẩm

    const lichSu = await NhatKyKho.find({ sanPham: id })
      .populate('nguoiThucHien', 'ten vaiTro')
      .sort('-createdAt'); // Mới nhất hiện lên đầu

    if (!lichSu) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy dữ liệu biến động' });
    }

    res.status(200).json({
      success: true,
      soLuong: lichSu.length,
      duLieu: lichSu
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi truy vấn nhật ký' });
  }
};

// @desc    Lấy toàn bộ nhật ký kho (Phục vụ Dashboard hoặc Xem chung)
// @route   GET /api/v1/nhat-ky-kho
exports.layTatCaNhatKy = async (req, res) => {
  try {
    const { loaiBienDong, tuNgay, denNgay } = req.query;
    let truyVan = {};

    // Bộ lọc theo loại (NhapKho, BanHang, HoanTra, KiemKe)
    if (loaiBienDong) {
      truyVan.loaiBienDong = loaiBienDong;
    }

    // Bộ lọc theo thời gian
    if (tuNgay || denNgay) {
      truyVan.createdAt = {};
      if (tuNgay) truyVan.createdAt.$gte = new Date(tuNgay);
      if (denNgay) truyVan.createdAt.$lte = new Date(denNgay);
    }

    const nhatKy = await NhatKyKho.find(truyVan)
      .populate('sanPham', 'tenSanPham maSanPham')
      .populate('nguoiThucHien', 'ten')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      soLuong: nhatKy.length,
      duLieu: nhatKy
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi lấy nhật ký tổng hợp' });
  }
};

// @desc    Hàm nội bộ để lấy dữ liệu cho Báo cáo Excel "Nhập - Xuất - Tồn"
// Chức năng này sẽ được gọi từ BaoCaoController
exports.layDuLieuBaoCaoExcel = async (tuNgay, denNgay) => {
  // Logic: Nhóm theo sản phẩm và tính toán tổng nhập, tổng xuất
  return await NhatKyKho.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(tuNgay), $lte: new Date(denNgay) }
      }
    },
    {
      $group: {
        _id: "$sanPham",
        tongNhap: {
          $sum: { $cond: [{ $eq: ["$loaiBienDong", "NhapKho"] }, "$soLuongThayDoi", 0] }
        },
        tongBan: {
          $sum: { $cond: [{ $eq: ["$loaiBienDong", "BanHang"] }, { $abs: "$soLuongThayDoi" }, 0] }
        },
        tongHoan: {
          $sum: { $cond: [{ $eq: ["$loaiBienDong", "HoanTra"] }, "$soLuongThayDoi", 0] }
        }
      }
    },
    {
      $lookup: {
        from: "sanphams",
        localField: "_id",
        foreignField: "_id",
        as: "thongTinSanPham"
      }
    },
    { $unwind: "$thongTinSanPham" }
  ]);
};