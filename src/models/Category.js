const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tên danh mục là bắt buộc'],
    unique: true,
    trim: true,
    maxlength: [50, 'Tên danh mục không vượt quá 50 ký tự'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Mô tả không vượt quá 200 ký tự'],
  },
  image: {
    type: String, // URL hoặc đường dẫn hình ảnh
    default: 'https://via.placeholder.com/150', // Hình ảnh mặc định nếu không có
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Category', categorySchema);