const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { authenticate } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

router.use(authenticate);

router.get('/', asyncHandler(expenseController.listExpenses));
router.get('/categories', asyncHandler(expenseController.getExpenseCategories));
router.get('/:id', asyncHandler(expenseController.getExpense));
router.post('/', asyncHandler(expenseController.createExpense));
router.put('/:id', asyncHandler(expenseController.updateExpense));
router.delete('/:id', asyncHandler(expenseController.deleteExpense));

module.exports = router;
