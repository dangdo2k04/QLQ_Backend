const mongoose = require('mongoose');
const GioHangSchema = new mongoose.Schema({
  nguoiDung: { type: mongoose.Schema.Types.ObjectId, ref: 'NguoiDung', unique: true },
  items: [{
    sanPham: { type: mongoose.Schema.Types.ObjectId, ref: 'SanPham' },
    soLuong: { type: Number, default: 1 }
  }]
}, { timestamps: true });

module.exports = mongoose.model('GioHang', GioHangSchema);