const PhieuNhap = require('../models/PhieuNhap');
const SanPham = require('../models/SanPham');
const NhatKyKho = require('../models/NhatKyKho');
const mongoose = require('mongoose');

// @desc    Tạo phiếu nhập mới và cập nhật kho
// @route   POST /api/v1/phieu-nhap
// @access  Riêng tư/Admin/NhanVienKho
exports.taoPhieuNhap = async (req, res) => {
  // Bắt đầu một Transaction để đảm bảo tính nguyên tử (Atomicity)
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { nhaCungCap, chiTietNhap, ghiChu } = req.body;
    let tongTienPhieu = 0;

    // 1. Khởi tạo đối tượng Phiếu Nhập
    const phieuNhapMoi = new PhieuNhap({
      maPhieu: `PN${Date.now()}`, // Tạo mã phiếu tự động dựa trên thời gian
      nhaCungCap,
      nhanVienNhap: req.user.id,
      chiTietNhap,
      ghiChu
    });

    // 2. Lặp qua từng sản phẩm trong danh sách nhập để cập nhật kho
    for (let item of chiTietNhap) {
      const sanPham = await SanPham.findById(item.sanPham).session(session);

      if (!sanPham) {
        throw new Error(`Sản phẩm với ID ${item.sanPham} không tồn tại`);
      }

      // Lưu nhật ký biến động kho TRƯỚC khi cập nhật
      await NhatKyKho.create([{
        sanPham: sanPham._id,
        loaiBienDong: 'NhapKho',
        soLuongThayDoi: item.soLuong,
        tonKhoTruoc: sanPham.tonKho,
        tonKhoSau: sanPham.tonKho + item.soLuong,
        nguoiThucHien: req.user.id,
        maThamChieu: phieuNhapMoi.maPhieu
      }], { session });

      // Cập nhật số lượng tồn kho và giá vốn của sản phẩm
      sanPham.tonKho += item.soLuong;
      sanPham.giaVon = item.giaNhap; // Cập nhật giá vốn mới nhất
      await sanPham.save({ session });

      tongTienPhieu += (item.soLuong * item.giaNhap);
    }

    // 3. Cập nhật tổng tiền và lưu Phiếu Nhập
    phieuNhapMoi.tongTien = tongTienPhieu;
    await phieuNhapMoi.save({ session });

    // Hoàn tất giao dịch
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: 'Nhập kho thành công',
      duLieu: phieuNhapMoi
    });

  } catch (error) {
    // Nếu có bất kỳ lỗi nào, hủy bỏ toàn bộ thay đổi (Rollback)
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Lấy danh sách tất cả phiếu nhập
// @route   GET /api/v1/phieu-nhap
exports.layTatCaPhieuNhap = async (req, res) => {
  try {
    const phieus = await PhieuNhap.find()
      .populate('nhanVienNhap', 'ten email')
      .populate('chiTietNhap.sanPham', 'tenSanPham maSanPham')
      .sort('-createdAt');

    res.status(200).json({ success: true, soLuong: phieus.length, duLieu: phieus });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

// @desc    Xem chi tiết một phiếu nhập
// @route   GET /api/v1/phieu-nhap/:id
exports.layChiTietPhieuNhap = async (req, res) => {
  try {
    const phieu = await PhieuNhap.findById(req.params.id)
      .populate('nhanVienNhap', 'ten')
      .populate('chiTietNhap.sanPham', 'tenSanPham maSanPham giaBan');

    if (!phieu) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu nhập' });
    }

    res.status(200).json({ success: true, duLieu: phieu });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};