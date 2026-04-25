const Product = require('../models/Product');

exports.getAllProducts = (limit, page, sort, filter) => {
  return new Promise(async (resolve, reject) => {
    try {
      const limitValue = parseInt(limit) || 30;
      const pageValue = parseInt(page) || 0;

      // Input validation
      if (limitValue <= 0 || pageValue < 0) {
        console.log('Invalid limit or page:', { limitValue, pageValue });
        return reject({
          status: 'ERR',
          message: 'Limit phải lớn hơn 0 và page phải không âm.'
        });
      }

      console.log('Input params:', { limit: limitValue, page: pageValue, sort, filter });

      let query = { inventory: { $gt: 0 } };
      let totalProduct;

      // Xử lý bộ lọc
      let parsedFilter;
      try {
        parsedFilter = typeof filter === 'string' ? JSON.parse(filter) : filter;
      } catch (e) {
        console.log('Invalid filter JSON format:', filter);
        return reject({
          status: 'ERR',
          message: 'Định dạng bộ lọc không hợp lệ (JSON parse error).'
        });
      }

      if (Array.isArray(parsedFilter) && parsedFilter.length >= 2) {
        const label = parsedFilter[0];
        const value = parsedFilter[1];
        console.log('Filter applied:', { label, value });

        if (label === 'price' && Array.isArray(value) && value.length === 2) {
          const [minPrice, maxPrice] = value.map(Number);
          if (isNaN(minPrice) || isNaN(maxPrice) || minPrice < 0 || maxPrice < 0 || minPrice > maxPrice) {
            console.log('Invalid price range:', { minPrice, maxPrice });
            return reject({
              status: 'ERR',
              message: 'Khoảng giá không hợp lệ.'
            });
          }
          query = { price: { $gte: minPrice, $lte: maxPrice } };
        } else if (label && typeof value === 'string') {
          query[label] = { $regex: value, $options: 'i' };
        } else {
          console.log('Invalid filter format:', parsedFilter);
          return reject({
            status: 'ERR',
            message: 'Định dạng bộ lọc không hợp lệ.'
          });
        }
        totalProduct = await Product.countDocuments(query);
      } else {
        totalProduct = await Product.countDocuments();
      }

      // Xử lý sắp xếp
      let sortOptions = { createdAt: -1 }; // Mặc định sắp xếp theo createdAt giảm dần
      if (sort && typeof sort === 'string') {
        const [order, field] = sort.split(',');
        if (['asc', 'desc'].includes(order) && ['name', 'price', 'createdAt'].includes(field)) {
          sortOptions = { [field]: order === 'asc' ? 1 : -1 };
        } else {
          console.log('Invalid sort format:', sort);
          return reject({
            status: 'ERR',
            message: 'Định dạng sắp xếp không hợp lệ. Ví dụ: asc,price'
          });
        }
      }
      console.log('Sort applied:', sortOptions);

      // Lấy dữ liệu sản phẩm
      const allProducts = await Product.find(query)
        .limit(limitValue)
        .skip(pageValue * limitValue)
        .sort(sortOptions);

      console.log('Products found:', allProducts.length);

      resolve({
        status: 'OK',
        message: 'Get all product successfully',
        data: allProducts,
        total: totalProduct,
        pageCurrent: pageValue + 1,
        totalPage: Math.ceil(totalProduct / limitValue),
      });
    } catch (e) {
      console.error('Error in getAllProduct:', e.stack);
      reject({
        status: 'ERR',
        message: 'Lỗi server khi lấy sản phẩm.',
        error: e.message
      });
    }
  });
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
// @route   GET /category/:category
// @access  Public
exports.getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 10, page = 1, exclude } = req.query;

    // Build query
    let query = { category: { $regex: new RegExp(category, 'i') } };
    if (exclude) {
      query._id = { $ne: exclude }; // Exclude the product with the given ID
    }

    // Calculate skip for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(query)
      .limit(parseInt(limit))
      .skip(skip)
      .lean(); 

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy sản phẩm trong danh mục ${category}`,
      });
    }

    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error('Lỗi lấy sản phẩm theo danh mục:', error.message, error.stack); // Include stack trace for debugging
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy sản phẩm theo danh mục',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined, // Show error details in development only
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
