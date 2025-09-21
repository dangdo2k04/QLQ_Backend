const express = require('express');
const { register, login, getUsers, getMe, updateMe, deleteUser, changePassword } = require('../controllers/authController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/users', protect, authorize('admin'), getUsers); // Lấy tất cả người dùng (Admin)
router.delete('/users/:id', protect, authorize('admin'), deleteUser); // Xóa người dùng (Admin)
router.get('/me', protect, getMe); // Lấy thông tin người dùng hiện tại
router.put('/me', protect, updateMe); // Cập nhật thông tin người dùng hiện tại
router.put('/change-password', protect, changePassword);

module.exports = router;