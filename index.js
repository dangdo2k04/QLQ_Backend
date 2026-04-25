const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const productRoutes = require('./src/routes/productRoutes');
const cartRoutes = require('./src/routes/cartRoutes');
const authRoutes = require('./src/routes/authRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const app = express();

dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(express.json());
app.use(cors());

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Đã kết nối thành công với MongoDB');
  })
  .catch((err) => {
    console.error('Lỗi kết nối MongoDB:', err);
  });

app.use('/', productRoutes);
app.use('/api/v1', cartRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/categories', categoryRoutes);

app.listen(PORT, () => {
  console.log(`Server đang chạy trên http://localhost:${PORT}`);
});