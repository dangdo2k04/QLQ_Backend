const SanPham = require('../models/SanPham');

// @desc    Lấy tất cả sản phẩm (Có phân trang, lọc, sắp xếp)
// @route   GET /api/v1/san-pham
exports.layTatCaSanPham = async (req, res) => {
  try {
    const { gioiHan, trang, sapXep, boLoc, tenSanPham } = req.query;
    
    const limitValue = parseInt(gioiHan) || 20;
    const pageValue = parseInt(trang) - 1 || 0;
    let query = { trangThai: 'DangBan' };

    // 1. Tìm kiếm theo tên sản phẩm
    if (tenSanPham) {
      query.tenSanPham = { $regex: tenSanPham, $options: 'i' };
    }

    // 2. Xử lý bộ lọc (Ví dụ: danh mục, khoảng giá)
    if (boLoc) {
      const parsedFilter = JSON.parse(boLoc);
      query = { ...query, ...parsedFilter };
    }

    // 3. Xử lý sắp xếp
    let sortOptions = { createdAt: -1 };
    if (sapXep) {
      const [field, order] = sapXep.split(',');
      sortOptions = { [field]: order === 'asc' ? 1 : -1 };
    }

    const tongSanPham = await SanPham.countDocuments(query);
    const sanPhams = await SanPham.find(query)
      .limit(limitValue)
      .skip(pageValue * limitValue)
      .sort(sortOptions)
      .populate('danhMuc', 'tenDanhMuc'); // Lấy tên danh mục để hiển thị

    res.status(200).json({
      success: true,
      duLieu: sanPhams,
      tong: tongSanPham,
      trangHienTai: pageValue + 1,
      tongTrang: Math.ceil(tongSanPham / limitValue),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi lấy sản phẩm' });
  }
};

// @desc    Tạo sản phẩm mới (Lần đầu nhập kho)
// @route   POST /api/v1/san-pham
exports.taoSanPham = async (req, res) => {
  try {
    const { maSanPham } = req.body;
    
    // Kiểm tra mã sản phẩm duy nhất
    const tonTai = await SanPham.findOne({ maSanPham });
    if (tonTai) {
      return res.status(400).json({ success: false, message: 'Mã sản phẩm này đã tồn tại trong kho' });
    }

    const sanPham = await SanPham.create(req.body);
    res.status(201).json({ success: true, duLieu: sanPham });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Lấy chi tiết sản phẩm
// @route   GET /api/v1/san-pham/:id
exports.layChiTietSanPham = async (req, res) => {
  try {
    const sanPham = await SanPham.findById(req.params.id).populate('danhMuc');

    if (!sanPham) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    res.status(200).json({ success: true, duLieu: sanPham });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi định dạng ID hoặc lỗi máy chủ' });
  }
};

// @desc    Cập nhật thông tin sản phẩm (Giá bán, mô tả...)
// @route   PUT /api/v1/san-pham/:id
exports.capNhatSanPham = async (req, res) => {
  try {
    const sanPham = await SanPham.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!sanPham) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm để cập nhật' });
    }

    res.status(200).json({ success: true, duLieu: sanPham });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi cập nhật' });
  }
};

// @desc    Xóa sản phẩm (Soft Delete hoặc Kiểm tra ràng buộc)
// @route   DELETE /api/v1/san-pham/:id
exports.xoaSanPham = async (req, res) => {
  try {
    const sanPham = await SanPham.findById(req.params.id);

    if (!sanPham) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
    }

    // Kiểm tra nếu sản phẩm còn tồn kho thì không cho xóa, chỉ cho chuyển trạng thái
    if (sanPham.tonKho > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Sản phẩm còn tồn kho, không thể xóa. Vui lòng chuyển trạng thái sang Ngừng kinh doanh.' 
      });
    }

    await sanPham.deleteOne();
    res.status(200).json({ success: true, message: 'Đã xóa sản phẩm thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi xóa' });
  }
};

// @desc    Lấy danh sách sản phẩm sắp hết hàng (Dành cho Admin/Kho)
// @route   GET /api/v1/san-pham/canh-bao-ton-kho
exports.layCanhBaoTonKho = async (req, res) => {
    try {
        // Tìm những sản phẩm có tonKho nhỏ hơn hoặc bằng nguongThongBao
        const sanPhams = await SanPham.find({
            $expr: { $lte: ["$tonKho", "$nguongThongBao"] },
            trangThai: 'DangBan'
        });

        res.status(200).json({
            success: true,
            soLuong: sanPhams.length,
            duLieu: sanPhams
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};