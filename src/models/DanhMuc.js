const mongoose = require('mongoose');
const DanhMucSchema = new mongoose.Schema({
  tenDanhMuc: { type: String, required: true, unique: true },
  moTa: { type: String },
  hinhAnh: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('DanhMuc', DanhMucSchema);