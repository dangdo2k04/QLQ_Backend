const PhieuNhap = require('../models/PhieuNhap');
const SanPham = require('../models/SanPham');
const NhatKyKho = require('../models/NhatKyKho');
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');

// @desc    Tạo phiếu nhập mới và cập nhật kho
// @route   POST /api/v1/phieu-nhap
// @access  Riêng tư/Admin/NhanVienKho
exports.taoPhieuNhap = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { nhaCungCap, chiTietNhap, ghiChu } = req.body;

    // Kiểm tra đầu vào cơ bản
    if (!chiTietNhap || chiTietNhap.length === 0) {
      throw new Error('Phiếu nhập phải có ít nhất một sản phẩm');
    }

    let tongTienPhieu = 0;
    const danhSachCapNhat = [];

    // 1. Lặp qua để kiểm tra và tính toán (chưa lưu)
    for (let item of chiTietNhap) {
      const sanPham = await SanPham.findById(item.sanPham).session(session);
      if (!sanPham) {
        throw new Error(`Sản phẩm ${item.sanPham} không tồn tại`);
      }

      // Tính tổng tiền dựa trên giá nhập thực tế gửi lên
      const thanhTien = item.soLuong * item.giaNhap;
      tongTienPhieu += thanhTien;

      // 2. Tạo nhật ký kho (Truyền session để đồng bộ)
      await NhatKyKho.create([{
        sanPham: sanPham._id,
        loaiBienDong: 'NhapKho',
        soLuongThayDoi: item.soLuong,
        tonKhoTruoc: sanPham.tonKho,
        tonKhoSau: sanPham.tonKho + item.soLuong,
        nguoiThucHien: req.user.id,
        maThamChieu: `PN-${Date.now()}` // Tạm thời lấy mã này
      }], { session });

      // 3. Cập nhật sản phẩm
      sanPham.tonKho += item.soLuong;
      sanPham.giaVon = item.giaNhap; // Cập nhật giá vốn mới nhất
      await sanPham.save({ session });
    }

    // 4. Tạo và lưu phiếu nhập
    const phieuNhapMoi = await PhieuNhap.create([{
      maPhieu: `PN${Date.now()}`,
      nhaCungCap,
      nhanVienNhap: req.user.id,
      chiTietNhap,
      tongTien: tongTienPhieu, // Tổng tiền đã tính lại ở trên
      ghiChu
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: 'Nhập kho thành công và đã cập nhật tồn kho',
      duLieu: phieuNhapMoi[0]
    });

  } catch (error) {
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

// @desc    Xuất một phiếu nhập cụ thể ra file Excel
// @route   GET /api/v1/phieu-nhap/:id/xuat-excel
exports.xuatExcelPhieuNhap = async (req, res) => {
    try {
        const phieu = await PhieuNhap.findById(req.params.id)
            .populate('nhanVienNhap', 'ten')
            .populate('chiTietNhap.sanPham', 'tenSanPham maSanPham');

        if (!phieu) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu nhập' });
        }

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('ChiTietPhieuNhap');

        // 1. Thông tin chung của phiếu
        sheet.addRow(['THÔNG TIN PHIẾU NHẬP KHO']);
        sheet.addRow(['Mã phiếu:', phieu.maPhieu]);
        sheet.addRow(['Nhà cung cấp:', phieu.nhaCungCap]);
        sheet.addRow(['Nhân viên lập:', phieu.nhanVienNhap?.ten || 'N/A']);
        sheet.addRow(['Ngày nhập:', phieu.createdAt.toLocaleString('vi-VN')]);
        sheet.addRow(['Ghi chú:', phieu.ghiChu || '']);
        sheet.addRow([]); // Dòng trống

        // 2. Tiêu đề bảng sản phẩm
        const headerRow = sheet.addRow(['STT', 'Mã SP', 'Tên Sản Phẩm', 'Số Lượng', 'Giá Nhập', 'Thành Tiền']);
        
        // Định dạng header bảng
        headerRow.eachCell((cell) => {
            cell.font = { bold: true };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = {
                top: { style: 'thin' }, left: { style: 'thin' },
                bottom: { style: 'thin' }, right: { style: 'thin' }
            };
        });

        // 3. Đổ dữ liệu sản phẩm
        phieu.chiTietNhap.forEach((item, index) => {
            const row = sheet.addRow([
                index + 1,
                item.sanPham?.maSanPham,
                item.sanPham?.tenSanPham,
                item.soLuong,
                item.giaNhap,
                item.soLuong * item.giaNhap
            ]);
            row.getCell(5).numFmt = '#,##0'; // Định dạng số cho giá
            row.getCell(6).numFmt = '#,##0';
        });

        // 4. Tổng kết tiền
        sheet.addRow([]);
        const totalRow = sheet.addRow(['', '', '', '', 'TỔNG TIỀN:', phieu.tongTien]);
        totalRow.getCell(5).font = { bold: true };
        totalRow.getCell(6).font = { bold: true, color: { argb: 'FF0000' } };
        totalRow.getCell(6).numFmt = '#,##0 "VNĐ"';

        // 5. Cấu hình độ rộng cột
        sheet.getColumn(2).width = 15;
        sheet.getColumn(3).width = 35;
        sheet.getColumn(5).width = 15;
        sheet.getColumn(6).width = 20;

        // 6. Trả file về client
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=PhieuNhap-${phieu.maPhieu}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};