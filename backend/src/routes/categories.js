const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticate } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

router.use(authenticate);

router.get('/', asyncHandler(categoryController.listCategories));
router.get('/all', asyncHandler(categoryController.getAllCategories));
router.get('/:id', asyncHandler(categoryController.getCategory));
router.post('/', asyncHandler(categoryController.createCategory));
router.put('/:id', asyncHandler(categoryController.updateCategory));
router.delete('/:id', asyncHandler(categoryController.deleteCategory));

module.exports = router;
