const mongoose = require('mongoose');
const SanPhamSchema = new mongoose.Schema({
  maSanPham: { type: String, required: true, unique: true }, // Nhập tay thay cho SKU
  tenSanPham: { type: String, required: true },
  moTa: { type: String },
  danhMuc: { type: mongoose.Schema.Types.ObjectId, ref: 'DanhMuc', required: true },
  giaBan: { type: Number, required: true },
  giaVon: { type: Number, required: true }, // Dùng để tính lợi nhuận
  tonKho: { type: Number, default: 0 },
  nguongThongBao: { type: Number, default: 5 }, // Tự động báo khi dưới mức này
  donViTinh: { type: String, default: 'Cái' },
  hinhAnh: {
    type: [String],
    default: []
  },
  trangThai: { type: String, enum: ['DangBan', 'NgungKinhDoanh'], default: 'DangBan' }
}, { timestamps: true });

module.exports = mongoose.model('SanPham', SanPhamSchema);