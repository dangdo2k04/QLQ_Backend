const mongoose = require('mongoose');
const ThongBaoSchema = new mongoose.Schema({
  nguoiNhan: { type: mongoose.Schema.Types.ObjectId, ref: 'NguoiDung' },
  tieuDe: { type: String, required: true },
  noiDung: { type: String, required: true },
  loaiThongBao: { 
    type: String, 
    enum: ['HeThong', 'DonHang', 'TonKho'], 
    default: 'HeThong' 
  },
  daXem: { type: Boolean, default: false },
  duongDan: { type: String } // Link dẫn đến màn hình chi tiết tương ứng
}, { timestamps: true });

module.exports = mongoose.model('ThongBao', ThongBaoSchema);