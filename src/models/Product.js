const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  images: [{ public_id: String, url: String }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Product', productSchema);