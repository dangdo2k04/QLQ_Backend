const mongoose = require('mongoose');
const NhatKyKhoSchema = new mongoose.Schema({
  sanPham: { type: mongoose.Schema.Types.ObjectId, ref: 'SanPham' },
  loaiBienDong: { type: String, enum: ['NhapKho', 'BanHang', 'HoanTra', 'KiemKe'] },
  soLuongThayDoi: { type: Number }, // Số dương là tăng, số âm là giảm
  tonKhoTruoc: { type: Number },
  tonKhoSau: { type: Number },
  nguoiThucHien: { type: mongoose.Schema.Types.ObjectId, ref: 'NguoiDung' },
  maThamChieu: { type: String }, // ID của Đơn hàng hoặc Phiếu nhập tương ứng
}, { timestamps: true });

module.exports = mongoose.model('NhatKyKho', NhatKyKhoSchema);