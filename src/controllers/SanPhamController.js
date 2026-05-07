const SanPham = require('../models/SanPham');

// @desc    Lấy tất cả sản phẩm (Có phân trang, lọc, sắp xếp)
// @route   GET /api/v1/san-pham
exports.layTatCaSanPham = async (req, res) => {
  try {
    // 1. Lấy và chuẩn hóa các tham số query
    const { 
      gioiHan, 
      trang, 
      sapXep, 
      danhMuc, // Lấy trực tiếp danhMuc thay vì bóc từ boLoc
      giaMin, 
      giaMax, 
      tenSanPham 
    } = req.query;
    
    const limitValue = parseInt(gioiHan) || 9; // Khớp với itemsPerPage ở Frontend
    const pageValue = Math.max(parseInt(trang) || 1, 1);
    const skipValue = (pageValue - 1) * limitValue;

    let query = { trangThai: 'DangBan' };

    // 2. Tìm kiếm theo tên sản phẩm (Regex an toàn hơn)
    if (tenSanPham) {
      query.tenSanPham = { $regex: tenSanPham.trim(), $options: 'i' };
    }

    // 3. Lọc theo Danh mục (Đây là phần bạn vừa muốn thêm)
    if (danhMuc && danhMuc !== 'all') {
      query.danhMuc = danhMuc;
    }

    // 4. Lọc theo Khoảng giá (Nếu có)
    if (giaMin || giaMax) {
      query.giaBan = {};
      if (giaMin) query.giaBan.$gte = parseInt(giaMin);
      if (giaMax) query.giaBan.$lte = parseInt(giaMax);
    }

    // 5. Xử lý sắp xếp (Mặc định mới nhất trước)
    let sortOptions = { createdAt: -1 };
    if (sapXep) {
      // Ví dụ sapXep=giaBan,asc
      const [field, order] = sapXep.split(',');
      sortOptions = { [field]: order === 'asc' ? 1 : -1 };
    }

    // 6. Thực thi truy vấn (Chạy song song để tối ưu thời gian phản hồi)
    const [sanPhams, tongSanPham] = await Promise.all([
      SanPham.find(query)
        .limit(limitValue)
        .skip(skipValue)
        .sort(sortOptions)
        .populate('danhMuc', 'tenDanhMuc'),
      SanPham.countDocuments(query)
    ]);

    // 7. Phản hồi dữ liệu
    res.status(200).json({
      success: true,
      soLuong: tongSanPham, // Tổng số lượng tìm thấy (để làm phân trang)
      duLieu: sanPhams,
      trangHienTai: pageValue,
      tongTrang: Math.ceil(tongSanPham / limitValue),
    });
  } catch (error) {
    console.error("Lỗi layTatCaSanPham:", error);
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