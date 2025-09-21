const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
  product: { // Đổi tên trường từ productId thành product để đồng nhất với controller
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
  },
});

const CartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // Thêm unique: true để đảm bảo mỗi user chỉ có 1 giỏ hàng
  },
  items: [CartItemSchema],
}, {
  timestamps: true, // Thêm timestamps để lưu thời gian tạo và cập nhật
});

module.exports = mongoose.model('Cart', CartSchema);