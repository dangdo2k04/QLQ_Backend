// const bcrypt = require('bcryptjs');
const User = require('../models/User');
const jwt = require('jsonwebtoken');


// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = await User.create({ name, email, password });
    const token = jwt.sign({ id: user._id }, 'theanh', { expiresIn: '1h' });
    res.status(201).json({ success: true, token, user: { name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ email và mật khẩu' });
    }
    const user = await User.findOne({ email }).select('+password');
    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác' });
    }
    const token = jwt.sign({ id: user._id }, 'theanh', { expiresIn: '1h' });
    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      token,
      user: { name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Lỗi server' });
  }
};

// @desc    Lấy tất cả người dùng
// @route   GET /api/v1/auth/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Lỗi server' });
  }
};

// @desc    Lấy thông tin người dùng hiện tại
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Lỗi server' });
  }
};

// @desc    Cập nhật thông tin người dùng (người dùng tự cập nhật)
// @route   PUT /api/v1/auth/me
// @access  Private
exports.updateMe = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user.id, req.body, {
      new: true,
      runValidators: true
    }).select('-password');
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Lỗi server' });
  }
};

// @desc    Xóa người dùng (Admin)
// @route   DELETE /api/v1/auth/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }
    res.status(200).json({ success: true, message: 'Đã xóa người dùng thành công' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Lỗi server' });
  }
};

// @desc    Đổi mật khẩu người dùng
// @route   PUT /api/v1/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    console.log('Change password request body:', { currentPassword, newPassword }); // Log để kiểm tra
    if (!currentPassword || !newPassword || typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới hợp lệ' });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }
    console.log('User found:', { id: user._id, email: user.email, password: user.password }); // Log để kiểm tra

    if (!user.password) {
      return res.status(400).json({ success: false, message: 'Mật khẩu người dùng không tồn tại trong cơ sở dữ liệu' });
    }

    // So sánh mật khẩu plain-text
    if (currentPassword !== user.password) {
      return res.status(401).json({ success: false, message: 'Mật khẩu hiện tại không đúng' });
    }

    // Validate new password
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    // Cập nhật mật khẩu
    user.password = newPassword;
    const updatedUser = await user.save();
    console.log('User after save:', updatedUser); // Log để kiểm tra xem mật khẩu đã lưu chưa

    res.status(200).json({ success: true, message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    console.error('Lỗi khi đổi mật khẩu:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi đổi mật khẩu' });
  }
};