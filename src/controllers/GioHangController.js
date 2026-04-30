const GioHang = require('../models/GioHang');
const SanPham = require('../models/SanPham');
const mongoose = require('mongoose');

const tinhToanChiTietGioHang = (items) => {
    let tamTinh = 0;
    let tongSoLuong = 0;

    items.forEach(item => {
        // Chỉ tính nếu sản phẩm tồn tại và có giá bán
        if (item.sanPham) {
            tamTinh += item.soLuong * (item.sanPham.giaBan || 0);
            tongSoLuong += item.soLuong;
        }
    });

    // --- LOGIC PHÍ VẬN CHUYỂN ---
    // Ví dụ: Đơn hàng từ 1.500.000đ trở lên được Freeship (0đ), dưới đó phí là 30.000đ
    const phiVanChuyen = (tamTinh >= 1500000 || tamTinh === 0) ? 0 : 30000;

    // --- LOGIC KHUYẾN MÃI ---
    // Ví dụ: Giảm 50.000đ cho đơn hàng có tổng tiền hàng trên 1.000.000đ
    let khuyenMai = 0;
    if (tamTinh >= 1000000) {
        khuyenMai = 50000;
    }

    // --- TỔNG THANH TOÁN CUỐI CÙNG ---
    const tongThanhToan = tamTinh + phiVanChuyen - khuyenMai;

    return { 
        tamTinh, 
        tongSoLuong, 
        phiVanChuyen, 
        khuyenMai, 
        tongThanhToan 
    };
};
// @desc    Lấy giỏ hàng của người dùng hiện tại
// @route   GET /api/v1/gio-hang
exports.layGioHang = async (req, res) => {
  try {
    // Populate đầy đủ thông tin sản phẩm
    let gioHang = await GioHang.findOne({ nguoiDung: req.user._id })
      .populate('items.sanPham', 'tenSanPham giaBan hinhAnh tonKho maSanPham');

    // Nếu chưa có giỏ hàng, trả về cấu trúc mặc định với các con số bằng 0
    if (!gioHang) {
      return res.status(200).json({ 
        success: true, 
        duLieu: { items: [] },
        chiTietThanhToan: {
            tamTinh: 0,
            tongSoLuong: 0,
            phiVanChuyen: 0,
            khuyenMai: 0,
            tongThanhToan: 0
        }
      });
    }

    // Thực hiện tính toán chi tiết
    const stats = tinhToanChiTietGioHang(gioHang.items);

    res.status(200).json({ 
      success: true, 
      duLieu: gioHang, 
      tongMatHang: gioHang.items.length, // Số lượng dòng sản phẩm khác nhau
      tongSoLuong: stats.tongSoLuong,    // Tổng số lượng các món cộng lại
      chiTietThanhToan: {
          tamTinh: stats.tamTinh,
          phiVanChuyen: stats.phiVanChuyen,
          khuyenMai: stats.khuyenMai,
          tongThanhToan: stats.tongThanhToan
      }
    });
  } catch (error) {
    console.error("Lỗi Controller GioHang:", error);
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
  const { id } = req.params; // Đây phải là item._id (69eec2584675...)

  try {
    const gioHang = await GioHang.findOne({ nguoiDung: req.user._id }).populate('items.sanPham');

    if (!gioHang) {
      return res.status(404).json({ success: false, message: 'Giỏ hàng không tồn tại' });
    }

    const item = gioHang.items.id(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy dòng hàng này' });
    }

    // Kiểm tra tồn kho
    if (soLuong > item.sanPham.tonKho) {
      return res.status(400).json({ 
        success: false, 
        message: `Kho chỉ còn ${item.sanPham.tonKho} sản phẩm.` 
      });
    }

    item.soLuong = soLuong;
    await gioHang.save();

    // GỌI HÀM TÍNH TOÁN ĐÃ XÂY DỰNG (Để trả về tiền ship, KM mới nhất)
    const stats = tinhToanChiTietGioHang(gioHang.items);

    res.status(200).json({ 
      success: true, 
      duLieu: gioHang,
      chiTietThanhToan: stats // Trả về để Frontend cập nhật bảng tính tiền ngay
    });
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