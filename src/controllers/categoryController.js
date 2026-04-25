const Category = require('../models/Category');
const Product = require('../models/Product');

// @desc    Lấy tất cả danh mục
// @route   GET /api/v1/categories
// @access  Public
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    console.error('Lỗi lấy danh mục:', error.message);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh mục',
    });
  }
};

// @desc    Lấy chi tiết danh mục theo ID
// @route   GET /api/v1/categories/:id
// @access  Public
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy danh mục với ID ${req.params.id}`,
      });
    }
    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Lỗi lấy chi tiết danh mục:', error.message);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy chi tiết danh mục',
    });
  }
};

// @desc    Tạo danh mục mới
// @route   POST /api/v1/categories
// @access  Private/Admin
exports.createCategory = async (req, res) => {
  try {
    const { name, description, image } = req.body;
    const category = await Category.create({ name, description, image });
    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Lỗi tạo danh mục:', error.message);
    res.status(400).json({
      success: false,
      message: 'Lỗi khi tạo danh mục',
      error: error.message,
    });
  }
};

// @desc    Cập nhật danh mục
// @route   PUT /api/v1/categories/:id
// @access  Private/Admin
exports.updateCategory = async (req, res) => {
  try {
    const { name, description, image } = req.body;
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, description, image },
      { new: true, runValidators: true }
    );
    if (!category) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy danh mục với ID ${req.params.id}`,
      });
    }
    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Lỗi cập nhật danh mục:', error.message);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật danh mục',
    });
  }
};

// @desc    Xóa danh mục
// @route   DELETE /api/v1/categories/:id
// @access  Private/Admin
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy danh mục với ID ${req.params.id}`,
      });
    }
    res.status(200).json({
      success: true,
      message: 'Danh mục đã được xóa',
    });
  } catch (error) {
    console.error('Lỗi xóa danh mục:', error.message);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa danh mục',
    });
  }
};

exports.getProductsByCategory = async (req, res) => {
 try {
  // 1. Kiểm tra danh mục có tồn tại không
  const category = await Category.findById(req.params.id);
  if (!category) {
   return res.status(404).json({
    success: false,
    message: `Không tìm thấy danh mục với ID ${req.params.id}`,
   });
  }

  // 2. Tìm tất cả sản phẩm có trường 'category' trùng với ID danh mục
  // Giả định trường khóa ngoại trong Product Model là 'category'
  const products = await Product.find({ category: req.params.id }).sort({ createdAt: -1 });

  // 3. Trả về kết quả
  res.status(200).json({
   success: true,
   count: products.length,
   categoryName: category.name, // Có thể trả về tên danh mục để tiện sử dụng ở frontend
   products: products,
  });
 } catch (error) {
  console.error('Lỗi lấy sản phẩm theo danh mục:', error.message);
  // Xử lý lỗi cú pháp ID không hợp lệ của Mongoose
  if (error.name === 'CastError') {
   return res.status(400).json({
    success: false,
    message: 'ID danh mục không hợp lệ',
   });
  }
  res.status(500).json({
   success: false,
   message: 'Lỗi server khi lấy sản phẩm theo danh mục',
  });
 }
};