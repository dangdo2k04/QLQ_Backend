const mongoose = require('mongoose');

const PhieuXuatSchema = new mongoose.Schema({
  maPhieu: { type: String, required: true, unique: true },
  
  // Phân loại để dễ báo cáo: BanHang, XuatHuy, XuatTraNCC, NoiBo
  loaiXuat: { 
    type: String, 
    enum: ['BanHang', 'XuatHuy', 'XuatTraNCC', 'NoiBo'], 
    default: 'BanHang' 
  },

  // Nếu xuất cho đơn hàng thì ref tới DonHang
  donHang: { type: mongoose.Schema.Types.ObjectId, ref: 'DonHang' },

  // Nhân viên thực hiện nhặt hàng/xuất kho
  nhanVienKho: { type: mongoose.Schema.Types.ObjectId, ref: 'NguoiDung', required: true },

  chiTietXuat: [{
    sanPham: { type: mongoose.Schema.Types.ObjectId, ref: 'SanPham', required: true },
    soLuongYeuCau: { type: Number, required: true }, // Số lượng trên đơn hàng
    soLuongThucXuat: { type: Number, required: true }, // Số lượng thủ kho thực tế lấy đi
    giaXuat: { type: Number }, // Thường lấy bằng giá vốn hoặc giá bán tùy mục đích báo cáo
    ghiChu: String
  }],

  tongSoLuong: { type: Number, default: 0 },
  
  trangThai: { 
    type: String, 
    enum: ['DangChuanBi', 'DaXuatKho', 'DaHuy'], 
    default: 'DangChuanBi' 
  },
  
  ngayXuatKho: Date,
  ghiChuPhieu: String
}, { timestamps: true });

module.exports = mongoose.model('PhieuXuat', PhieuXuatSchema);