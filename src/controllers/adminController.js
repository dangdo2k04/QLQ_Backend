const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');

// @desc    Lấy các số liệu thống kê chung
// @route   GET /api/v1/admin/dashboard
// @access  Private/Admin
exports.getAdminDashboardStats = async (req, res) => {
  try {
    // Tổng số người dùng đã đăng ký
    const totalUsers = await User.countDocuments();

    // Tổng số sản phẩm đã bán
    // Chúng ta sẽ duyệt qua tất cả đơn hàng và tính tổng số lượng sản phẩm
    const allOrders = await Order.find();
    let totalProductsSold = 0;
    allOrders.forEach(order => {
      order.items.forEach(item => {
        totalProductsSold += item.quantity;
      });
    });

    // Tổng doanh thu
    // Tính tổng tất cả các đơn hàng đã được thanh toán (hoặc delivered)
    const deliveredOrders = await Order.find({ status: 'shipped' });
    const totalRevenue = deliveredOrders.reduce((acc, order) => acc + order.totalAmount, 0);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalProductsSold,
        totalRevenue
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: 'Lỗi server' });
  }
};

exports.getDailyRevenue = async (req, res) => {
  try {
    // Lấy tất cả đơn hàng đã giao (shipped)
    const orders = await Order.aggregate([
      {
        $match: { status: 'shipped' },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
        },
      },
      {
        $sort: { '_id': 1 }, // Sắp xếp theo ngày tăng dần
      },
    ]);

    // Chuyển đổi kết quả thành mảng { date, revenue }
    const dailyRevenue = orders.map(item => ({
      date: item._id,
      revenue: item.revenue,
    }));

    res.status(200).json({
      success: true,
      stats: dailyRevenue,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Lỗi server' });
  }
};