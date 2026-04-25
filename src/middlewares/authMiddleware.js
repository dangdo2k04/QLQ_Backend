// server/src/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const NguoiDung = require('../models/NguoiDung');

// @desc    Xác thực Token (Bảo vệ các route riêng tư)
exports.baoVe = async (req, res, next) => {
  let token;

  // Kiểm tra token từ header Authorization
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Đảm bảo token tồn tại
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Bạn không có quyền truy cập, vui lòng đăng nhập' 
    });
  }

  try {
    // Giải mã token (Sử dụng secret key 'theanh' như bạn đã định nghĩa)
    const decoded = jwt.verify(token, 'theanh');

    // Tìm người dùng trong DB và gán vào req.user
    // Sử dụng .select('-matKhau') để bảo mật
    req.user = await NguoiDung.findById(decoded.id).select('-matKhau');

    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Người dùng liên kết với token này không còn tồn tại' 
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token không hợp lệ hoặc đã hết hạn' 
    });
  }
};

// @desc    Kiểm tra vai trò người dùng (Phân quyền)
exports.phanQuyen = (...vaiTros) => {
  return (req, res, next) => {
    if (!vaiTros.includes(req.user.vaiTro)) {
      return res.status(403).json({
        success: false,
        message: `Vai trò [${req.user.vaiTro}] không có quyền thực hiện hành động này`
      });
    }
    next();
  };
};