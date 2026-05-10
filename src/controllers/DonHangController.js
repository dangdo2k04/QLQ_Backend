const DonHang = require('../models/DonHang');
const SanPham = require('../models/SanPham');
const GioHang = require('../models/GioHang');
const NhatKyKho = require('../models/NhatKyKho');
const ThongBao = require('../models/ThongBao');
const PhieuXuat = require('../models/PhieuXuat');
const ExcelJS = require('exceljs');
const mongoose = require('mongoose');

// @desc    Tạo đơn hàng mới (Xử lý trừ tồn kho & Xóa giỏ hàng)
// @route   POST /api/v1/don-hang
exports.taoDonHang = async (req, res) => {
    const { items, phuongThucThanhToan, diaChiGiaoHang, ghiChu } = req.body;
    const io = req.app.get('socketio');

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: 'Danh sách sản phẩm trống.' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        let tamTinh = 0;
        const danhSachSanPhamDonHang = [];
        const maDonHangMoi = `DH${Date.now()}`;

        // 1. Xử lý từng sản phẩm trong đơn hàng
        for (const item of items) {
            const sanPham = await SanPham.findById(item.sanPhamId).session(session);

            if (!sanPham || sanPham.trangThai !== 'DangBan') {
                throw new Error(`Sản phẩm ${item.sanPhamId} không tồn tại hoặc đã ngừng bán.`);
            }

            if (sanPham.tonKho < item.soLuong) {
                throw new Error(`Sản phẩm ${sanPham.tenSanPham} không đủ hàng (Kho còn: ${sanPham.tonKho}).`);
            }

            // --- Ghi nhật ký kho ---
            await NhatKyKho.create([{
                sanPham: sanPham._id,
                loaiBienDong: 'BanHang',
                soLuongThayDoi: -item.soLuong,
                tonKhoTruoc: sanPham.tonKho,
                tonKhoSau: sanPham.tonKho - item.soLuong,
                maThamChieu: maDonHangMoi,
                nguoiThucHien: req.user._id
            }], { session });

            // --- Trừ tồn kho ---
            sanPham.tonKho -= item.soLuong;
            await sanPham.save({ session });

            // --- Thông báo sắp hết hàng ---
            if (sanPham.tonKho <= sanPham.nguongThongBao) {
                const [thongBaoTon] = await ThongBao.create([{
                    tieuDe: '⚠️ Cảnh báo tồn kho',
                    noiDung: `Sản phẩm ${sanPham.tenSanPham} sắp hết (Còn ${sanPham.tonKho})`,
                    loaiThongBao: 'TonKho',
                    duongDan: `/admin/san-pham`
                }], { session });
                if (io) io.to('admin_room').emit('new_notification', thongBaoTon);
            }

            tamTinh += sanPham.giaBan * item.soLuong;
            danhSachSanPhamDonHang.push({
                sanPham: sanPham._id,
                soLuong: item.soLuong,
                giaLucDat: sanPham.giaBan // Lưu giá tại thời điểm đặt hàng
            });
        }

        // 2. LOGIC TÍNH PHÍ SHIP & KHUYẾN MÃI (Khớp với Giỏ hàng)
        const phiVanChuyen = tamTinh >= 1000000 ? 0 : 30000;
        const khuyenMai = tamTinh >= 2000000 ? 50000 : 0;
        const tongThanhToan = tamTinh + phiVanChuyen - khuyenMai;

        // 3. Tạo Đơn hàng
        const donHang = new DonHang({
            maDonHang: maDonHangMoi,
            khachHang: req.user._id,
            
            // SỬA TẠI ĐÂY: Phải dùng 'items' thay vì 'chiTietDonHang'
            items: danhSachSanPhamDonHang.map(item => ({
                sanPham: item.sanPham,
                soLuong: item.soLuong,
                giaLucBan: item.giaLucDat // SỬA: Chuyển 'giaLucDat' về 'giaLucBan' cho khớp Schema
            })),

            tongTien: tongThanhToan,
            phuongThucThanhToan,
            // diaChiGiaoHang: diaChiGiaoHang, // Đảm bảo Schema của bạn có trường này
            ghiChu,
            trangThaiDonHang: 'ChoXacNhan'
        });
        await donHang.save({ session });
        const phieuXuat = new PhieuXuat({
            maPhieu: `PX${Date.now()}`,
            loaiXuat: 'BanHang',
            donHang: donHang._id,
            nhanVienKho: req.user._id, // Tạm thời gán người tạo là admin/nv bán
            chiTietXuat: danhSachSanPhamDonHang.map(item => ({
                sanPham: item.sanPham,
                soLuongYeuCau: item.soLuong,
                soLuongThucXuat: item.soLuong, // Mặc định khớp, thủ kho sửa sau nếu thiếu
                giaXuat: item.giaLucBan
            })),
            trangThai: 'DangChuanBi'
        });
        await phieuXuat.save({ session });

        // 4. Thông báo Đa kênh (Admin & Khách)
        const [tbAdmin] = await ThongBao.create([{
            tieuDe: '🛒 Đơn hàng mới',
            noiDung: `Bạn có đơn hàng mới ${maDonHangMoi} từ ${req.user.ten}`,
            loaiThongBao: 'DonHang',
            duongDan: `/admin/don-hang/${donHang._id}`
        }], { session });
        if (io) io.to('admin_room').emit('new_notification', tbAdmin);

        const [tbKhach] = await ThongBao.create([{
            nguoiNhan: req.user._id,
            tieuDe: '🎉 Đặt hàng thành công',
            noiDung: `Đơn hàng ${maDonHangMoi} trị giá ${tongThanhToan.toLocaleString()}đ đã đặt thành công.`,
            loaiThongBao: 'DonHang',
            duongDan: `/my-orders`
        }], { session });
        if (io) io.to(req.user._id.toString()).emit('new_notification', tbKhach);

        // 5. Xóa giỏ hàng (Chỉ xóa những món đã đặt thành công)
        const idsDaMua = items.map(i => i.sanPhamId.toString());
        await GioHang.findOneAndUpdate(
            { nguoiDung: req.user._id },
            { $pull: { items: { sanPham: { $in: idsDaMua } } } },
            { session }
        );

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({ success: true, message: "Đặt hàng thành công", donHang, phieuXuatId: phieuXuat._id });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ success: false, message: error.message });
    }
};
// Hàm xuất Picking List cho thủ kho
exports.xuatExcelPickingList = async (req, res) => {
    try {
        const phieu = await PhieuXuat.findById(req.params.id)
            .populate('donHang')
            .populate('chiTietXuat.sanPham', 'tenSanPham maSanPham donViTinh');

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('PickingList');

        sheet.addRow(['DANH SÁCH NHẶT HÀNG (PICKING LIST)']).font = { bold: true, size: 14 };
        sheet.addRow(['Mã phiếu xuất:', phieu.maPhieu]);
        sheet.addRow(['Mã đơn hàng:', phieu.donHang?.maDonHang]);
        sheet.addRow([]);

        const header = sheet.addRow(['STT', 'Mã SP', 'Tên Sản Phẩm', 'Yêu Cầu', 'ĐVT', 'Thực Nhặt']);
        header.eachCell(c => { c.font = {bold: true}; c.border = {top:{style:'thin'}, bottom:{style:'thin'}}; });

        phieu.chiTietXuat.forEach((item, index) => {
            sheet.addRow([
                index + 1,
                item.sanPham?.maSanPham,
                item.sanPham?.tenSanPham,
                item.soLuongYeuCau,
                item.sanPham?.donViTinh,
                '.......'
            ]);
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Picking-${phieu.maPhieu}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// @desc    Lấy tất cả đơn hàng (Dành cho Admin)
exports.layTatCaDonHang = async (req, res) => {
  try {
    // 1. Lấy trạng thái từ query string (ví dụ: ?trangThai=ChoXacNhan)
    const { trangThai } = req.query;

    // 2. Tạo đối tượng lọc dữ liệu
    let filter = {};
    if (trangThai) {
      filter.trangThaiDonHang = trangThai;
    }

    // 3. Thực hiện truy vấn với filter
    const donHangs = await DonHang.find(filter)
      .populate('khachHang', 'ten email soDienThoai diaChi')
      .populate('items.sanPham', 'tenSanPham giaBan hinhAnh') // Thêm hinhAnh để admin dễ nhìn
      .sort('-createdAt');

    res.status(200).json({ 
      success: true, 
      soLuong: donHangs.length, 
      duLieu: donHangs 
    });
  } catch (error) {
    console.error("Lỗi lấy đơn hàng:", error);
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
    const io = req.app.get('socketio');

    // 1. Tìm đơn hàng trước để lấy thông tin khách hàng và mã đơn hàng
    const donHangCheck = await DonHang.findById(req.params.id);
    if (!donHangCheck) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    // 2. Cập nhật trạng thái mới
    const donHang = await DonHang.findByIdAndUpdate(
      req.params.id,
      { trangThaiDonHang: trangThaiMoi },
      { new: true, runValidators: true }
    );

    // 3. Mapping nội dung thông báo dựa trên trạng thái
    let tieuDeThongBao = '';
    let noiDungThongBao = '';

    switch (trangThaiMoi) {
      case 'DangGiao':
        tieuDeThongBao = '🚚 Đơn hàng đang được giao';
        noiDungThongBao = `Đơn hàng ${donHang.maDonHang} của bạn đang trên đường vận chuyển.`;
        break;
      case 'DaHoanThanh':
        tieuDeThongBao = '✅ Giao hàng thành công';
        noiDungThongBao = `Đơn hàng ${donHang.maDonHang} đã được giao thành công. Cảm ơn bạn đã mua hàng!`;
        break;
      case 'DaHuy':
        tieuDeThongBao = '❌ Đơn hàng đã bị hủy';
        noiDungThongBao = `Rất tiếc, đơn hàng ${donHang.maDonHang} đã bị hủy. Vui lòng liên hệ shop để biết thêm chi tiết.`;
        break;
      default:
        tieuDeThongBao = '📦 Cập nhật trạng thái đơn hàng';
        noiDungThongBao = `Đơn hàng ${donHang.maDonHang} đã chuyển sang trạng thái: ${trangThaiMoi}`;
    }

    // 4. Lưu thông báo vào Database dành cho Khách hàng
    const thongBao = await ThongBao.create({
      nguoiNhan: donHang.khachHang, // ID của khách hàng chủ đơn
      tieuDe: tieuDeThongBao,
      noiDung: noiDungThongBao,
      loaiThongBao: 'DonHang',
      duongDan: `/don-hang-cua-toi/${donHang._id}`
    });

    // 5. Bắn Real-time cho khách hàng qua Socket.io (Room là ID của khách)
    if (io) {
      io.to(donHang.khachHang.toString()).emit('new_notification', thongBao);
    }

    res.status(200).json({ 
      success: true, 
      message: 'Cập nhật trạng thái và gửi thông báo thành công',
      duLieu: donHang 
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật trạng thái: ' + error.message });
  }
};

exports.huyDonHang = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const donHang = await DonHang.findById(req.params.id).session(session);
    if (donHang.trangThaiDonHang === 'DaHoanThanh' || donHang.trangThaiDonHang === 'DaHuy') {
      throw new Error('Không thể hủy đơn hàng này');
    }

    // HOÀN KHO CHO TỪNG SẢN PHẨM
    for (const item of donHang.chiTietDonHang) {
      const sanPham = await SanPham.findById(item.sanPham).session(session);
      
      // Ghi nhật ký hoàn kho (Số dương)
      await NhatKyKho.create([{
        sanPham: sanPham._id,
        loaiBienDong: 'HoanTra', // Hoặc tạo loại mới là 'HuyDon'
        soLuongThayDoi: item.soLuong, 
        tonKhoTruoc: sanPham.tonKho,
        tonKhoSau: sanPham.tonKho + item.soLuong,
        maThamChieu: donHang.maDonHang,
        nguoiThucHien: req.user._id
      }], { session });

      sanPham.tonKho += item.soLuong;
      await sanPham.save({ session });
    }

    donHang.trangThaiDonHang = 'DaHuy';
    await donHang.save({ session });

    await session.commitTransaction();
    res.status(200).json({ success: true, message: 'Hủy đơn và hoàn kho thành công' });
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

// donHangController.js
exports.kiemTraDonHang = async (req, res) => {
    try {
        const { items } = req.body; // [{sanPhamId, soLuong}]
        let tamTinh = 0;
        const chiTietSanPhams = [];

        for (const item of items) {
            const sp = await SanPham.findById(item.sanPhamId);
            if (sp) {
                tamTinh += sp.giaBan * item.soLuong;
                chiTietSanPhams.push({
                    sanPham: sp,
                    soLuong: item.soLuong,
                    thanhTien: sp.giaBan * item.soLuong
                });
            }
        }

        const phiVanChuyen = tamTinh >= 1000000 ? 0 : 30000;
        const khuyenMai = tamTinh >= 2000000 ? 50000 : 0;

        res.json({
            success: true,
            duLieu: {
                items: chiTietSanPhams,
                tamTinh,
                phiVanChuyen,
                khuyenMai,
                tongThanhToan: tamTinh + phiVanChuyen - khuyenMai
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};