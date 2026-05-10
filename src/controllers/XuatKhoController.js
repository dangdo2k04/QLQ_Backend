const DonHang = require('../models/DonHang');
const SanPham = require('../models/SanPham');
const NhatKyKho = require('../models/NhatKyKho');
const mongoose = require('mongoose');
const PhieuXuat = require('../models/PhieuXuat');

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

exports.layTatCaPhieuXuat = async (req, res) => {
    try {
        // 1. Lấy tham số lọc từ URL (ví dụ: ?trangThai=DangChuanBi)
        const { trangThai, loaiXuat } = req.query;

        // 2. Xây dựng đối tượng query linh hoạt
        let filter = {};
        if (trangThai) filter.trangThai = trangThai;
        if (loaiXuat) filter.loaiXuat = loaiXuat;

        // 3. Thực hiện truy vấn dữ liệu
        const phieuXuats = await PhieuXuat.find(filter)
            .populate('donHang', 'maDonHang ghiChu') // Lấy mã đơn hàng liên quan
            .populate('nhanVienKho', 'ten email')   // Lấy tên nhân viên kho thực hiện
            .populate('chiTietXuat.sanPham', 'tenSanPham maSanPham hinhAnh') // Lấy chi tiết sản phẩm
            .sort('-createdAt'); // Phiếu mới nhất hiện lên đầu

        res.status(200).json({
            success: true,
            soLuong: phieuXuats.length,
            duLieu: phieuXuats
        });
    } catch (error) {
        console.error("Lỗi lấy danh sách phiếu xuất:", error);
        res.status(500).json({
            success: false,
            message: 'Không thể lấy danh sách phiếu xuất kho',
            error: error.message
        });
    }
};

exports.xuatExcelPhieuXuat = async (req, res) => {
    try {
        const phieu = await PhieuXuat.findById(req.params.id)
            .populate('nhanVienKho', 'ten')
            .populate('donHang', 'maDonHang ghiChu')
            .populate('chiTietXuat.sanPham', 'tenSanPham maSanPham donViTinh');

        if (!phieu) return res.status(404).json({ success: false, message: 'Không thấy phiếu xuất' });

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('PhieuXuatKho');

        // Tiêu đề
        sheet.addRow(['PHIẾU XUẤT KHO / DANH SÁCH NHẶT HÀNG']);
        sheet.addRow(['Mã phiếu xuất:', phieu.maPhieu]);
        sheet.addRow(['Loại xuất:', phieu.loaiXuat]);
        sheet.addRow(['Mã đơn hàng liên quan:', phieu.donHang?.maDonHang || 'N/A']);
        sheet.addRow(['Thủ kho thực hiện:', phieu.nhanVienKho?.ten || 'N/A']);
        sheet.addRow(['Ngày lập:', phieu.createdAt.toLocaleString('vi-VN')]);
        sheet.addRow([]);

        // Header bảng
        const header = sheet.addRow(['STT', 'Mã SP', 'Tên Sản Phẩm', 'Yêu Cầu', 'Thực Xuất', 'ĐVT', 'Ghi Chú']);
        header.eachCell(c => { c.font = {bold: true}; c.border = {top:{style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'}}; });

        // Data
        phieu.chiTietXuat.forEach((item, index) => {
            const row = sheet.addRow([
                index + 1,
                item.sanPham?.maSanPham,
                item.sanPham?.tenSanPham,
                item.soLuongYeuCau,
                item.soLuongThucXuat || '...', // Thủ kho sẽ điền vào đây
                item.sanPham?.donViTinh,
                item.ghiChu || ''
            ]);
            row.eachCell(c => { c.border = {top:{style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'}}; });
        });

        // Thiết lập file tải về
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=PhieuXuat-${phieu.maPhieu}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

