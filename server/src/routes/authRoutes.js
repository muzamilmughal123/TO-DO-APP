const express = require('express');
const { register, login, refreshToken, googleLogin, getMe, getTeamMembers } = require('../controllers/authController');
const { registerValidation, loginValidation } = require('../middleware/validation');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/refresh-token', refreshToken);
router.post('/google', googleLogin);
router.get('/me', verifyToken, getMe);
router.get('/team', verifyToken, getTeamMembers);

module.exports = router;
