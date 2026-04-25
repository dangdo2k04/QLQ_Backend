const express = require('express');
const { 
  getAllProducts, 
  createProduct, 
  getProductDetails, 
  updateProduct, 
  deleteProduct,
  getProductsByCategory,
} = require('../controllers/productController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const router = express.Router();

// Lấy tất cả sản phẩm
router.get('/', async (req, res) => {
  try {
    const { limit, page, sort, filter } = req.query;
    console.log('Request query:', req.query);
    const result = await getAllProducts(limit, page, sort, filter);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in /:', error);
    res.status(400).json({
      status: 'ERR',
      message: error.message || 'Lỗi server khi xử lý yêu cầu.'
    });
  }
});

// Lấy chi tiết sản phẩm
router.get('/:id', getProductDetails);

// Lấy sản phẩm theo hãng
router.get('/category/:category', getProductsByCategory);


// Các route dành cho Admin 
router.post('/', protect, authorize('admin'), createProduct);
router.put('/:id', protect, authorize('admin'), updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);

module.exports = router;