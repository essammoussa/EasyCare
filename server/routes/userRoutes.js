const express = require('express');
const router = express.Router();
const { upload, getProfile, updateProfile, uploadAvatar } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

router.route('/profile')
  .get(authMiddleware, getProfile)
  .put(authMiddleware, updateProfile);

router.post('/profile/avatar', authMiddleware, upload.single('avatar'), uploadAvatar);

module.exports = router;
