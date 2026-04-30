const DonHang = require('../models/DonHang');
const PhieuNhap = require('../models/PhieuNhap');
const SanPham = require('../models/SanPham');
const NhatKyKho = require('../models/NhatKyKho');
const NguoiDung = require('../models/NguoiDung');
const ExcelJS = require('exceljs');

// @desc    Thống kê tổng quan (Dashboard)
exports.layThongKeTongQuan = async (req, res) => {
  try {
    const tongSanPham = await SanPham.countDocuments();
    const tongDonHang = await DonHang.countDocuments();
    const tongNguoiDung = await NguoiDung.countDocuments();
    
    // Tính tổng doanh thu
    const doanhThu = await DonHang.aggregate([
      { $match: { trangThaiDonHang: 'DaHoanThanh' } },
      { $group: { _id: null, tong: { $sum: "$tongTien" } } }
    ]);

    // Sản phẩm sắp hết hàng
    const sapHetHang = await SanPham.find({ 
      $expr: { $lte: ["$tonKho", "$nguongThongBao"] } 
    }).limit(5);

    res.status(200).json({
      success: true,
      duLieu: {
        soLuongSanPham: tongSanPham,
        soLuongDonHang: tongDonHang,
        tongDoanhThu: doanhThu[0] ? doanhThu[0].tong : 0,
        danhSachSapHetHang: sapHetHang,
        soLuongNguoiDung: tongNguoiDung
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Xuất báo cáo Nhập - Xuất - Tồn ra file Excel
exports.xuatExcelKho = async (req, res) => {
  try {
    const { tuNgay, denNgay } = req.query;
    const start = tuNgay ? new Date(tuNgay) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = denNgay ? new Date(denNgay) : new Date();

    // Lấy dữ liệu tổng hợp từ Nhật ký kho
    const nhatKy = await NhatKyKho.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: {
          _id: "$sanPham",
          nhap: { $sum: { $cond: [{ $eq: ["$loaiBienDong", "NhapKho"] }, "$soLuongThayDoi", 0] } },
          xuat: { $sum: { $cond: [{ $eq: ["$loaiBienDong", "BanHang"] }, { $abs: "$soLuongThayDoi" }, 0] } }
      }},
      { $lookup: { from: 'sanphams', localField: '_id', foreignField: '_id', as: 'sp' } },
      { $unwind: '$sp' }
    ]);

    // Tạo file Excel
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('BaoCaoKho');

    sheet.columns = [
      { header: 'Mã SP', key: 'ma', width: 15 },
      { header: 'Tên Sản Phẩm', key: 'ten', width: 30 },
      { header: 'Tổng Nhập', key: 'nhap', width: 15 },
      { header: 'Tổng Xuất', key: 'xuat', width: 15 },
      { header: 'Tồn Kho Hiện Tại', key: 'ton', width: 15 }
    ];

    nhatKy.forEach(item => {
      sheet.addRow({
        ma: item.sp.maSanPham,
        ten: item.sp.tenSanPham,
        nhap: item.nhap,
        xuat: item.xuat,
        ton: item.sp.tonKho
      });
    });

    // Định dạng Header cho đẹp
    sheet.getRow(1).font = { bold: true };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=' + 'Bao-Cao-Kho.xlsx');

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// @desc    Lấy dữ liệu cho biểu đồ (Doanh thu 7 ngày gần nhất & Tỷ trọng danh mục)
exports.layDuLieuBieuDo = async (req, res) => {
  try {
    // 1. Dữ liệu biểu đồ đường: Doanh thu 7 ngày qua
    const bảyNgàyTrước = new Date();
    bảyNgàyTrước.setDate(bảyNgàyTrước.getDate() - 7);

    const doanhThuTheoNgay = await DonHang.aggregate([
      {
        $match: {
          trangThaiDonHang: 'DaHoanThanh',
          createdAt: { $gte: bảyNgàyTrước }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%d-%m", date: "$createdAt" } },
          tongDoanhThu: { $sum: "$tongTien" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // 2. Dữ liệu biểu đồ tròn: Tỷ trọng sản phẩm theo danh mục (Category)
    // Giả sử Model SanPham của bạn có trường 'danhMuc'
    const tyTrongDanhMuc = await SanPham.aggregate([
    {
        $lookup: {
        from: 'danhmucs', // Tên collection danh mục của bạn
        localField: 'danhMuc',
        foreignField: '_id',
        as: 'info'
        }
    },
    { $unwind: { path: '$info', preserveNullAndEmptyArrays: true } },
    {
        $group: {
        _id: "$info.tenDanhMuc", // Lấy tên thay vì ID
        soLuong: { $sum: 1 }
        }
    }
    ]);

    res.status(200).json({
      success: true,
      duLieu: {
        bieuDoDoanhThu: doanhThuTheoNgay, // Dùng cho Line Chart
        bieuDoDanhMuc: tyTrongDanhMuc     // Dùng cho Pie/Doughnut Chart
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};