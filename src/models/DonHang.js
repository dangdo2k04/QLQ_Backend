const mongoose = require('mongoose');
const DonHangSchema = new mongoose.Schema({
  maDonHang: { type: String, unique: true },
  khachHang: { type: mongoose.Schema.Types.ObjectId, ref: 'NguoiDung' },
  nhanVienBan: { type: mongoose.Schema.Types.ObjectId, ref: 'NguoiDung' },
  items: [{
    sanPham: { type: mongoose.Schema.Types.ObjectId, ref: 'SanPham' },
    soLuong: { type: Number, required: true },
    giaLucBan: { type: Number, required: true } // Quan trọng để làm báo cáo Excel
  }],
  tongTien: { type: Number, required: true },
  phuongThucThanhToan: { type: String, enum: ['TienMat', 'ChuyenKhoan', 'ViDienTu'] },
  trangThaiDonHang: { 
    type: String, 
    enum: ['ChoXacNhan', 'DangGiao', 'DaHoanThanh', 'DaHuy'], 
    default: 'ChoXacNhan' 
  },
  ghiChu: String
}, { timestamps: true });

module.exports = mongoose.model('DonHang', DonHangSchema);