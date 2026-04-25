const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  oldprice: { type: Number},
  images: [{ public_id: String, url: String }],
  category: { type: String },
  inventory: { type: Number, default: 0, min: 0, default: 100 },
  rate: { type: Number, default: 0 },
  ratio: { type: String, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Product', productSchema);