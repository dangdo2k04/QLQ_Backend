const NguoiDung = require('../models/NguoiDung');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// @desc    Đăng ký người dùng mới (Mặc định là khachhang)
// @route   POST /api/v1/auth/dang-ky
exports.dangKy = async (req, res) => {
  try {
    const { ten, email, matKhau, soDienThoai, diaChi, vaiTro } = req.body;

    // Mã hóa mật khẩu trước khi lưu
    const salt = await bcrypt.genSalt(10);
    const matKhauMaHoa = await bcrypt.hash(matKhau, salt);

    const nguoiDung = await NguoiDung.create({
      ten,
      email,
      matKhau: matKhauMaHoa,
      soDienThoai,
      diaChi,
      vaiTro: vaiTro || 'khachhang' // Nếu không có vai trò, mặc định là khách hàng
    });

    const token = jwt.sign({ id: nguoiDung._id }, 'dangdo', { expiresIn: '24h' });

    res.status(201).json({
      success: true,
      token,
      duLieu: {
        ten: nguoiDung.ten,
        email: nguoiDung.email,
        vaiTro: nguoiDung.vaiTro
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Đăng nhập
// @route   POST /api/v1/auth/dang-nhap
exports.dangNhap = async (req, res) => {
  try {
    const { email, matKhau } = req.body;

    if (!email || !matKhau) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ email và mật khẩu' });
    }

    // Kiểm tra người dùng và lấy cả mật khẩu để so sánh
    const nguoiDung = await NguoiDung.findOne({ email }).select('+matKhau');
    if (!nguoiDung) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác' });
    }

    // So sánh mật khẩu đã mã hóa
    const laMatKhauDung = await bcrypt.compare(matKhau, nguoiDung.matKhau);
    if (!laMatKhauDung) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác' });
    }

    const token = jwt.sign({ id: nguoiDung._id }, 'theanh', { expiresIn: '24h' }); // Tăng thời gian login cho nhân viên

    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      token,
      duLieu: {
        id: nguoiDung._id,
        ten: nguoiDung.ten,
        email: nguoiDung.email,
        vaiTro: nguoiDung.vaiTro
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};


// @desc    Đổi mật khẩu
exports.doiMatKhau = async (req, res) => {
  try {
    const { matKhauCu, matKhauMoi } = req.body;

    const nguoiDung = await NguoiDung.findById(req.user.id).select('+matKhau');
    
    const laMatKhauDung = await bcrypt.compare(matKhauCu, nguoiDung.matKhau);
    if (!laMatKhauDung) {
      return res.status(401).json({ success: false, message: 'Mật khẩu hiện tại không đúng' });
    }

    if (matKhauMoi.length < 6) {
        return res.status(400).json({ success: false, message: 'Mật khẩu mới phải từ 6 ký tự' });
    }

    const salt = await bcrypt.genSalt(10);
    nguoiDung.matKhau = await bcrypt.hash(matKhauMoi, salt);
    await nguoiDung.save();

    res.status(200).json({ success: true, message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi đổi mật khẩu' });
  }
};

// @desc    Lấy danh sách tất cả người dùng
// @route   GET /api/v1/nguoi-dung
// @access  Riêng tư/Admin
exports.layTatCaNguoiDung = async (req, res) => {
  try {
    // Có thể thêm filter theo vai trò nếu cần (vd: ?vaiTro=nhanvien_kho)
    const boLoc = {};
    if (req.query.vaiTro) {
      boLoc.vaiTro = req.query.vaiTro;
    }

    const danhSach = await NguoiDung.find(boLoc).select('-matKhau').sort('-createdAt');

    res.status(200).json({
      success: true,
      soLuong: danhSach.length,
      duLieu: danhSach
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi lấy danh sách' });
  }
};

// @desc    Lấy profile của người dùng hiện tại
// @route   GET /api/v1/nguoi-dung/me
// @access  Riêng tư
exports.layProfile = async (req, res) => {
  try {
    // req.user.id được lấy từ middleware bảo mật (auth)
    const nguoiDung = await NguoiDung.findById(req.user.id).select('-matKhau');

    if (!nguoiDung) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    res.status(200).json({
      success: true,
      duLieu: nguoiDung
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

// @desc    Xem chi tiết người dùng qua ID
// @route   GET /api/v1/nguoi-dung/:id
// @access  Riêng tư/Admin
exports.layChiTietNguoiDung = async (req, res) => {
  try {
    const nguoiDung = await NguoiDung.findById(req.params.id).select('-matKhau');

    if (!nguoiDung) {
      return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
    }

    res.status(200).json({
      success: true,
      duLieu: nguoiDung
    });
  } catch (error) {
    // Xử lý trường hợp ID không đúng định dạng MongoDB
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'ID không hợp lệ' });
    }
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

// @desc    Cập nhật thông tin cá nhân
exports.capNhatMe = async (req, res) => {
  try {
    const fieldsToUpdate = {
      ten: req.body.ten,
      soDienThoai: req.body.soDienThoai,
      diaChi: req.body.diaChi
    };

    const nguoiDung = await NguoiDung.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, duLieu: nguoiDung });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật thông tin' });
  }
};

exports.xoaNguoiDung = async (req, res) => {
  try {
    const nguoiDung = await NguoiDung.findById(req.params.id);

    if (!nguoiDung) {
      return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
    }

    await nguoiDung.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Đã xóa người dùng thành công'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi xóa người dùng' });
  }
};