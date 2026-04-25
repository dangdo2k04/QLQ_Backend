const DonHang = require('../models/DonHang');
const SanPham = require('../models/SanPham');
const GioHang = require('../models/GioHang');
const NhatKyKho = require('../models/NhatKyKho');
const ThongBao = require('../models/ThongBao');
const mongoose = require('mongoose');

// @desc    Tạo đơn hàng mới (Xử lý trừ tồn kho & Xóa giỏ hàng)
// @route   POST /api/v1/don-hang
exports.taoDonHang = async (req, res) => {
  const { items, phuongThucThanhToan, diaChiGiaoHang, ghiChu } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Danh sách sản phẩm không được trống.' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let tongTien = 0;
    const danhSachSanPhamDonHang = [];

    // 1. Kiểm tra tồn kho và tính toán giá
    for (const item of items) {
      const sanPham = await SanPham.findById(item.sanPhamId).session(session);

      if (!sanPham) {
        throw new Error(`Sản phẩm với ID ${item.sanPhamId} không tồn tại.`);
      }

      if (sanPham.tonKho < item.soLuong || item.soLuong <= 0) {
        throw new Error(`Sản phẩm ${sanPham.tenSanPham} không đủ tồn kho (Hiện có: ${sanPham.tonKho}).`);
      }

      // Ghi nhật ký biến động kho (Loại: BanHang)
      await NhatKyKho.create([{
        sanPham: sanPham._id,
        loaiBienDong: 'BanHang',
        soLuongThayDoi: -item.soLuong,
        tonKhoTruoc: sanPham.tonKho,
        tonKhoSau: sanPham.tonKho - item.soLuong,
        nguoiThucHien: req.user._id
      }], { session });

      // Cập nhật tồn kho sản phẩm
      sanPham.tonKho -= item.soLuong;
      await sanPham.save({ session });

      // Kiểm tra ngưỡng thông báo sắp hết hàng
      if (sanPham.tonKho <= sanPham.nguongThongBao) {
        await ThongBao.create([{
          tieuDe: 'Cảnh báo tồn kho',
          noiDung: `Sản phẩm ${sanPham.tenSanPham} sắp hết hàng (${sanPham.tonKho} món)`,
          loaiThongBao: 'TonKho',
          duongDan: `/admin/san-pham/${sanPham._id}`
        }], { session });
      }

      tongTien += sanPham.giaBan * item.soLuong;
      danhSachSanPhamDonHang.push({
        sanPham: sanPham._id,
        soLuong: item.soLuong,
        giaLucBan: sanPham.giaBan // Quan trọng: Bảo toàn giá tại thời điểm mua
      });
    }

    // 2. Tạo đơn hàng
    const donHang = new DonHang({
      maDonHang: `DH${Date.now()}`,
      khachHang: req.user._id,
      items: danhSachSanPhamDonHang,
      tongTien,
      phuongThucThanhToan,
      diaChiGiaoHang,
      ghiChu,
      trangThaiDonHang: 'ChoXacNhan'
    });
    await donHang.save({ session });

    // 3. Cập nhật mã tham chiếu cho Nhật ký kho (để sau này đối soát đơn hàng)
    await NhatKyKho.updateMany(
      { maThamChieu: "DANG_XU_LY", nguoiThucHien: req.user._id },
      { maThamChieu: donHang.maDonHang },
      { session }
    );

    // 4. Dọn dẹp giỏ hàng (Xóa các sản phẩm đã thanh toán)
    const gioHang = await GioHang.findOne({ nguoiDung: req.user._id }).session(session);
    if (gioHang) {
      const idsDaMua = items.map(i => i.sanPhamId.toString());
      gioHang.items = gioHang.items.filter(item => !idsDaMua.includes(item.sanPham.toString()));
      await gioHang.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ success: true, duLieu: donHang });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Lấy tất cả đơn hàng (Dành cho Admin)
exports.layTatCaDonHang = async (req, res) => {
  try {
    const donHangs = await DonHang.find()
      .populate('khachHang', 'ten email soDienThoai diaChi')
      .populate('items.sanPham', 'tenSanPham giaBan')
      .sort('-createdAt');
    res.status(200).json({ success: true, duLieu: donHangs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// @desc    Lấy đơn hàng của tôi
exports.layDonHangCuaToi = async (req, res) => {
  try {
    const donHangs = await DonHang.find({ khachHang: req.user._id })
      .populate('items.sanPham', 'tenSanPham giaBan hinhAnh')
      .sort('-createdAt');
    res.status(200).json({ success: true, duLieu: donHangs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// @desc    Xem chi tiết đơn hàng
exports.layChiTietDonHang = async (req, res) => {
  try {
    const donHang = await DonHang.findById(req.params.id)
      .populate('khachHang', 'ten email soDienThoai diaChi')
      .populate('items.sanPham', 'tenSanPham giaBan hinhAnh');

    if (!donHang) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    // Kiểm tra quyền: Chủ đơn hàng hoặc Admin mới được xem
    const laChuDon = donHang.khachHang._id.toString() === req.user._id.toString();
    const laQuanTri = req.user.vaiTro === 'admin';

    if (!laChuDon && !laQuanTri) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xem đơn hàng này' });
    }

    res.status(200).json({ success: true, duLieu: donHang });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

// @desc    Cập nhật trạng thái đơn hàng (Dành cho Admin/Giao hàng)
exports.capNhatTrangThai = async (req, res) => {
  try {
    const { trangThaiMoi } = req.body;
    const donHang = await DonHang.findByIdAndUpdate(
      req.params.id,
      { trangThaiDonHang: trangThaiMoi },
      { new: true, runValidators: true }
    );

    if (!donHang) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    res.status(200).json({ success: true, duLieu: donHang });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật trạng thái' });
  }
};