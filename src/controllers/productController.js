const Product = require('../models/Product');

exports.getAllProducts = async (req, res) => {
  const products = await Product.find();
  res.status(200).json({ success: true, products });
};

exports.createProduct = async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json({ success: true, product });
};

exports.getProductDetails = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// @desc    Lấy danh sách sản phẩm theo danh mục
// @route   GET /api/v1/products/category/:category
// @access  Public
exports.getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    // Tìm kiếm không phân biệt chữ hoa/thường
    const products = await Product.find({ category: { $regex: new RegExp(category, 'i') } });

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy sản phẩm trong danh mục ${category}`,
      });
    }

    res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    console.error('Lỗi lấy sản phẩm theo danh mục:', error.message);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy sản phẩm theo danh mục',
    });
  }
};

// @desc    Cập nhật sản phẩm
// @route   PUT /api/v1/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });

    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// @desc    Xóa sản phẩm
// @route   DELETE /api/v1/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Đã xóa sản phẩm thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};