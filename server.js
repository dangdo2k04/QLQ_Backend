const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

// Import Routes
const SanPhamRoutes = require('./src/routes/SanPhamRoutes');
const GioHangRoutes = require('./src/routes/GioHangRoutes');
const NguoiDungRoutes = require('./src/routes/NguoiDungRoutes');
const DonHangRoutes = require('./src/routes/DonHangRoutes');
const DanhMucRoutes = require('./src/routes/DanhMucRoutes');
const PhieuNhapRoutes = require('./src/routes/PhieuNhapRoutes');
const NhatKyKhoRoutes = require('./src/routes/NhatKyKhoRoutes');
const ThongBaoRoutes = require('./src/routes/ThongBaoRoutes');
const BaoCaoRoutes = require('./src/routes/BaoCaoRoutes');
const XuatKhoRoutes = require('./src/routes/XuatKhoRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- CẤU HÌNH CORS LINH HOẠT ---
// Danh sách các domain được phép truy cập (Local và Vercel sau này)
const whitelist = [
  'http://localhost:5173', // Cho phép khi bạn chạy npm run dev ở máy
  'http://localhost:3000',
  'https://qlk-bh-frontend.vercel.app', // Link Vercel của bạn
  process.env.FRONTEND_URL // Lấy từ biến môi trường trên Render cho chắc chắn
];

const corsOptions = {
  origin: function (origin, callback) {
    // Nếu request không có origin (như dùng Postman) hoặc nằm trong whitelist thì cho qua
    if (!origin || whitelist.includes(origin)) {
      callback(null, true);
    } else {
      console.log("Domain bị chặn bởi CORS:", origin);
      callback(new Error('Chặn bởi CORS: Domain này không có quyền truy cập!'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // Rất quan trọng nếu bạn có dùng Cookie hoặc gửi Token
};

app.use(cors(corsOptions));
app.options('/:any*', cors(corsOptions));
app.use(express.json());

// --- KHỞI TẠO HTTP SERVER ---
const server = http.createServer(app);

// --- TỐI ƯU SOCKET.IO CHO RENDER & VERCEL ---
const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling'], // Ưu tiên websocket, tự động lùi về polling nếu mạng yếu
  allowEIO3: true // Tăng khả năng tương thích
});

app.set('socketio', io);

// --- KẾT NỐI DATABASE ---
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB error:', err));

// --- QUẢN LÝ KẾT NỐI REAL-TIME ---
io.on('connection', (socket) => {
  console.log(`📡 Connected: ${socket.id}`);

  // Phân luồng theo vai trò (Role-based Rooms)
  socket.on('setup_user', (userData) => {
    socket.join(userData.id); // Mỗi user vào 1 phòng riêng theo ID của họ
    if (userData.vaiTro === 'admin') {
      socket.join('admin_room'); // Admin vào phòng quản trị
      console.log(`🔑 Admin ${userData.ten} joined admin_room`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Disconnected: ${socket.id}`);
  });
});

// --- API ROUTES ---
app.use('/api/v1/san-pham', SanPhamRoutes);
app.use('/api/v1/gio-hang', GioHangRoutes);
app.use('/api/v1/nguoi-dung', NguoiDungRoutes);
app.use('/api/v1/don-hang', DonHangRoutes);
app.use('/api/v1/danh-muc', DanhMucRoutes);
app.use('/api/v1/phieu-nhap', PhieuNhapRoutes);
app.use('/api/v1/nhat-ky-kho', NhatKyKhoRoutes);
app.use('/api/v1/thong-bao', ThongBaoRoutes);
app.use('/api/v1/bao-cao', BaoCaoRoutes);
app.use('/api/v1/xuat-kho', XuatKhoRoutes);
// --- START SERVER ---
server.listen(PORT, () => {
  console.log(`🚀 Server ready on port ${PORT}`);
});