const express = require('express');
const router = express.Router();
const { register, login, forgotPassword, resetPassword, changePassword, googleLogin } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.put('/change-password', authMiddleware, changePassword);

module.exports = router;
