const express = require('express');
const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getProductsByCategory
} = require('../controllers/categoryController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Routes public
router.get('/', getAllCategories);
router.get('/:id', getCategoryById);
router.route('/:id/products').get(getProductsByCategory);

// Routes admin
router.post('/', protect, authorize('admin'), createCategory);
router.put('/:id', protect, authorize('admin'), updateCategory);
router.delete('/:id', protect, authorize('admin'), deleteCategory);

module.exports = router;