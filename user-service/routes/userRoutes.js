const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { expressjwt: jwtMiddleware } = require('express-jwt');
const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret';

router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/:id', userController.getProfile);
router.put('/:id', userController.updateProfile);
router.get('/', jwtMiddleware({ secret: jwtSecret, algorithms: ['HS256'] }), userController.requireRole('admin'), userController.getAllUsers);

module.exports = router;

