const DanhMuc = require('../models/DanhMuc');
const SanPham = require('../models/SanPham');

// @desc    Lấy tất cả danh mục
// @route   GET /api/v1/danh-muc
// @access  Công khai
exports.layTatCaDanhMuc = async (req, res) => {
  try {
    // Sắp xếp theo tên từ A-Z để nhân viên dễ tìm kiếm thủ công
    const danhMucs = await DanhMuc.find().sort({ tenDanhMuc: 1 });
    
    res.status(200).json({
      success: true,
      soLuong: danhMucs.length,
      duLieu: danhMucs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi lấy danh mục' });
  }
};

// @desc    Lấy chi tiết danh mục theo ID
// @route   GET /api/v1/danh-muc/:id
exports.layDanhMucTheoId = async (req, res) => {
  try {
    const danhMuc = await DanhMuc.findById(req.params.id);
    if (!danhMuc) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
    }
    res.status(200).json({ success: true, duLieu: danhMuc });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi định dạng ID hoặc lỗi máy chủ' });
  }
};

// @desc    Tạo danh mục mới
// @route   POST /api/v1/danh-muc
// @access  Riêng tư/Admin
exports.taoDanhMuc = async (req, res) => {
  try {
    const { tenDanhMuc, moTa, hinhAnh } = req.body;

    // Kiểm tra trùng tên trước khi tạo
    const tonTai = await DanhMuc.findOne({ tenDanhMuc });
    if (tonTai) {
      return res.status(400).json({ success: false, message: 'Tên danh mục này đã tồn tại' });
    }

    const danhMuc = await DanhMuc.create({ tenDanhMuc, moTa, hinhAnh });
    res.status(201).json({ success: true, duLieu: danhMuc });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Cập nhật danh mục
// @route   PUT /api/v1/danh-muc/:id
exports.capNhatDanhMuc = async (req, res) => {
  try {
    const danhMuc = await DanhMuc.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!danhMuc) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
    }

    res.status(200).json({ success: true, duLieu: danhMuc });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật danh mục' });
  }
};

// @desc    Xóa danh mục (Cải tiến quan trọng: Kiểm tra ràng buộc tồn kho)
// @route   DELETE /api/v1/danh-muc/:id
exports.xoaDanhMuc = async (req, res) => {
  try {
    // 1. Kiểm tra xem có sản phẩm nào thuộc danh mục này không
    const coSanPham = await SanPham.findOne({ danhMuc: req.params.id });
    
    if (coSanPham) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa danh mục này vì vẫn còn sản phẩm thuộc danh mục. Hãy chuyển sản phẩm sang danh mục khác trước khi xóa.'
      });
    }

    const danhMuc = await DanhMuc.findByIdAndDelete(req.params.id);
    if (!danhMuc) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
    }

    res.status(200).json({ success: true, message: 'Đã xóa danh mục thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi xóa danh mục' });
  }
};

// @desc    Lấy danh sách sản phẩm thuộc một danh mục cụ thể
// @route   GET /api/v1/danh-muc/:id/san-pham
exports.laySanPhamTheoDanhMuc = async (req, res) => {
  try {
    const danhMuc = await DanhMuc.findById(req.params.id);
    if (!danhMuc) {
      return res.status(404).json({ success: false, message: 'Danh mục không tồn tại' });
    }

    // Tìm sản phẩm và hiển thị thông tin tồn kho
    const sanPhams = await SanPham.find({ danhMuc: req.params.id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      soLuong: sanPhams.length,
      tenDanhMuc: danhMuc.tenDanhMuc,
      duLieu: sanPhams,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách sản phẩm' });
  }
};