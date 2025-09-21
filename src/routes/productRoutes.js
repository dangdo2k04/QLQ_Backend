const express = require('express');
const { 
  getAllProducts, 
  createProduct, 
  getProductDetails, 
  updateProduct, 
  deleteProduct,
  getProductsByCategory
} = require('../controllers/productController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const router = express.Router();

// Lấy tất cả sản phẩm
router.get('/', getAllProducts);

// Lấy chi tiết sản phẩm
router.get('/:id', getProductDetails);

// Lấy sản phẩm theo hãng
router.get('/category/:category', getProductsByCategory);

// Các route dành cho Admin 
router.post('/', protect, authorize('admin'), createProduct);
router.put('/:id', protect, authorize('admin'), updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);

module.exports = router;