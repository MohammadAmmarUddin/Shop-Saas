const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { registerSchema, loginSchema, refreshSchema, changePasswordSchema } = require('../validators/authValidator');
const asyncHandler = require('../utils/asyncHandler');

router.post('/register', validate(registerSchema), asyncHandler(authController.register));
router.post('/login', validate(loginSchema), asyncHandler(authController.login));
router.post('/refresh', validate(refreshSchema), asyncHandler(authController.refresh));
router.post('/logout', authenticate, asyncHandler(authController.logout));
router.get('/me', authenticate, asyncHandler(authController.getMe));
router.put('/change-password', authenticate, validate(changePasswordSchema), asyncHandler(authController.changePassword));
router.put('/profile', authenticate, asyncHandler(authController.updateProfile));

module.exports = router;
