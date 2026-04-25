const mongoose = require('mongoose');
const PhieuNhapSchema = new mongoose.Schema({
  maPhieu: { type: String, unique: true },
  nhaCungCap: { type: String, required: true },
  nhanVienNhap: { type: mongoose.Schema.Types.ObjectId, ref: 'NguoiDung' },
  chiTietNhap: [{
    sanPham: { type: mongoose.Schema.Types.ObjectId, ref: 'SanPham' },
    soLuong: { type: Number, required: true },
    giaNhap: { type: Number, required: true }
  }],
  tongTien: { type: Number },
  ghiChu: String
}, { timestamps: true });

module.exports = mongoose.model('PhieuNhap', PhieuNhapSchema);