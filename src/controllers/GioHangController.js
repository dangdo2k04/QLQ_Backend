const GioHang = require('../models/GioHang');
const SanPham = require('../models/SanPham');
const mongoose = require('mongoose');

// @desc    Lấy giỏ hàng của người dùng hiện tại
// @route   GET /api/v1/gio-hang
exports.layGioHang = async (req, res) => {
  try {
    let gioHang = await GioHang.findOne({ nguoiDung: req.user._id })
      .populate('items.sanPham', 'tenSanPham giaBan hinhAnh tonKho maSanPham');

    if (!gioHang) {
      // Nếu chưa có giỏ hàng trong DB, trả về mảng trống thay vì lỗi
      return res.status(200).json({ success: true, duLieu: { items: [] } });
    }

    const tongMatHang = gioHang.items.length;
    const tongSoLuong = gioHang.items.reduce((acc, item) => acc + item.soLuong, 0);

    res.status(200).json({ 
      success: true, 
      duLieu: gioHang, 
      tongMatHang, 
      tongSoLuong 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi lấy giỏ hàng' });
  }
};

// @desc    Thêm sản phẩm vào giỏ hàng
// @route   POST /api/v1/gio-hang
exports.themSanPhamVaoGio = async (req, res) => {
  const { sanPhamId, soLuong } = req.body;

  try {
    // 1. Kiểm tra đầu vào
    if (!mongoose.Types.ObjectId.isValid(sanPhamId)) {
      return res.status(400).json({ success: false, message: 'ID sản phẩm không hợp lệ' });
    }

    const soLuongThem = parseInt(soLuong) || 1;
    if (soLuongThem <= 0) {
      return res.status(400).json({ success: false, message: 'Số lượng phải lớn hơn 0' });
    }

    // 2. Kiểm tra tồn kho sản phẩm thực tế
    const sanPham = await SanPham.findById(sanPhamId);
    if (!sanPham) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
    }

    if (sanPham.tonKho < soLuongThem) {
      return res.status(400).json({ 
        success: false, 
        message: `Sản phẩm ${sanPham.tenSanPham} hiện chỉ còn ${sanPham.tonKho} trong kho.` 
      });
    }

    // 3. Tìm hoặc khởi tạo giỏ hàng
    let gioHang = await GioHang.findOne({ nguoiDung: req.user._id });
    if (!gioHang) {
      gioHang = new GioHang({ nguoiDung: req.user._id, items: [] });
    }

    // 4. Xử lý thêm mới hoặc tăng số lượng
    const viTriSanPham = gioHang.items.findIndex(item => item.sanPham.toString() === sanPhamId);

    if (viTriSanPham > -1) {
      const soLuongMoi = gioHang.items[viTriSanPham].soLuong + soLuongThem;
      
      // Kiểm tra xem tổng số lượng sau khi cộng có vượt quá tồn kho không
      if (soLuongMoi > sanPham.tonKho) {
        return res.status(400).json({ 
          success: false, 
          message: `Không thể thêm. Tổng số lượng trong giỏ (${soLuongMoi}) vượt quá tồn kho thực tế.` 
        });
      }
      gioHang.items[viTriSanPham].soLuong = soLuongMoi;
    } else {
      gioHang.items.push({ sanPham: sanPhamId, soLuong: soLuongThem });
    }

    await gioHang.save();
    await gioHang.populate('items.sanPham', 'tenSanPham giaBan hinhAnh tonKho');

    res.status(200).json({ success: true, message: 'Đã cập nhật giỏ hàng', duLieu: gioHang });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

// @desc    Cập nhật số lượng của một item trong giỏ (Dùng cho trang Cart khi thay đổi số lượng)
// @route   PUT /api/v1/gio-hang/:id
exports.capNhatSoLuongItem = async (req, res) => {
  const { soLuong } = req.body;
  const { id } = req.params; // _id của item trong mảng items

  try {
    const gioHang = await GioHang.findOne({ nguoiDung: req.user._id }).populate('items.sanPham');

    if (!gioHang) {
      return res.status(404).json({ success: false, message: 'Giỏ hàng trống' });
    }

    const item = gioHang.items.id(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không có trong giỏ hàng' });
    }

    // Kiểm tra tồn kho trước khi cập nhật số lượng mới
    if (soLuong > item.sanPham.tonKho) {
      return res.status(400).json({ 
        success: false, 
        message: `Số lượng yêu cầu (${soLuong}) vượt quá tồn kho hiện có (${item.sanPham.tonKho}).` 
      });
    }

    item.soLuong = soLuong;
    await gioHang.save();

    res.status(200).json({ success: true, duLieu: gioHang });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

// @desc    Xóa sản phẩm khỏi giỏ hàng
// @route   DELETE /api/v1/gio-hang/:id
exports.xoaSanPhamKhoiGio = async (req, res) => {
  const { id } = req.params;

  try {
    const gioHang = await GioHang.findOne({ nguoiDung: req.user._id });

    if (!gioHang) {
      return res.status(404).json({ success: false, message: 'Giỏ hàng không tồn tại' });
    }

    gioHang.items.pull(id);
    await gioHang.save();
    await gioHang.populate('items.sanPham', 'tenSanPham giaBan hinhAnh');

    res.status(200).json({ success: true, message: 'Đã xóa sản phẩm khỏi giỏ', duLieu: gioHang });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};