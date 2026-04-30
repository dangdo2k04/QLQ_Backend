const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
// Render thường sử dụng cổng 10000 hoặc biến môi trường PORT
const PORT = process.env.PORT || 10000;

// --- 1. CẤU HÌNH CORS ---
const whitelist = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://qlk-bh-frontend.vercel.app',
  process.env.FRONTEND_URL
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Chặn bởi CORS: Domain không được phép!'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

// Áp dụng CORS middleware
app.use(cors(corsOptions));

// --- 2. XỬ LÝ OPTIONS THỦ CÔNG (TRÁNH LỖI PATH-TO-REGEXP) ---
// Thay thế cho app.options('*') hoặc app.options('/:any*') gây crash trên Node v24
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.origin;
    if (!origin || whitelist.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin || '*');
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- 3. HEALTH CHECK ROUTE ---
app.get('/', (req, res) => {
  res.status(200).json({ message: "Backend is online!", status: "OK" });
});

// --- 4. KẾT NỐI DATABASE ---
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => {
    console.error('❌ MongoDB error:', err);
    process.exit(1); 
  });

// --- 5. HTTP SERVER & SOCKET.IO ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
  connectTimeout: 45000
});

app.set('socketio', io);

// Socket logic
io.on('connection', (socket) => {
  console.log(`📡 Connected: ${socket.id}`);
  socket.on('setup_user', (userData) => {
    if (userData?.id) {
      socket.join(userData.id);
      if (userData.vaiTro === 'admin') socket.join('admin_room');
    }
  });
  socket.on('disconnect', () => console.log(`🔌 Disconnected: ${socket.id}`));
});

// --- 6. API ROUTES ---
const version = '/api/v1';
app.use(`${version}/san-pham`, require('./src/routes/SanPhamRoutes'));
app.use(`${version}/gio-hang`, require('./src/routes/GioHangRoutes'));
app.use(`${version}/nguoi-dung`, require('./src/routes/NguoiDungRoutes'));
app.use(`${version}/don-hang`, require('./src/routes/DonHangRoutes'));
app.use(`${version}/danh-muc`, require('./src/routes/DanhMucRoutes'));
app.use(`${version}/phieu-nhap`, require('./src/routes/PhieuNhapRoutes'));
app.use(`${version}/nhat-ky-kho`, require('./src/routes/NhatKyKhoRoutes'));
app.use(`${version}/thong-bao`, require('./src/routes/ThongBaoRoutes'));
app.use(`${version}/bao-cao`, require('./src/routes/BaoCaoRoutes'));
app.use(`${version}/xuat-kho`, require('./src/routes/XuatKhoRoutes'));

// --- 7. START SERVER ---
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});