const mongoose = require('mongoose');

const NguoiDungSchema = new mongoose.Schema({
  ten: { type: String, required: [true, 'Vui lòng nhập tên'] },
  email: { type: String, required: [true, 'Vui lòng nhập email'], unique: true },
  matKhau: { type: String, required: true, select: false },
  soDienThoai: { type: String, required: true },
  diaChi: { type: String },
  vaiTro: { 
    type: String, 
    enum: ['admin', 'nhanvien_kho', 'nhanvien_banhang', 'khachhang'], 
    default: 'khachhang' 
  }
}, { timestamps: true });

module.exports = mongoose.model('NguoiDung', NguoiDungSchema);