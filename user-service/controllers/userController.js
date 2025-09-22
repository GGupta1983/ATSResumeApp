const User = require('../models/user');
/**
 * User Controller
 * Handles registration, login, profile retrieval, and update for users.
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const sanitize = require('mongo-sanitize');
const Joi = require('joi');

// Role-based access middleware
exports.requireRole = (role) => {
  return (req, res, next) => {
    console.log('requireRole middleware - req.user:', req.user);
    if (!req.user || req.user.role !== role) {
      console.log('Role check failed. Expected:', role, 'Actual:', req.user ? req.user.role : undefined);
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }
    next();
  };
};

exports.register = async (req, res) => {
  /**
   * Register a new user
   * @route POST /users/register
   * @param {string} username
   * @param {string} email
   * @param {string} password
   * @param {string} [role]
   * @returns {Object} Newly created user
   */
  try {
    // Joi schema for registration
    const schema = Joi.object({
      username: Joi.string().min(3).required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(2).required(),
      role: Joi.string().valid('candidate', 'recruiter', 'admin').default('candidate')
    });
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details.map(d => d.message) });
    }
    // Sanitize input
  const username = sanitize(value.username);
  const email = sanitize(value.email);
  const password = sanitize(value.password);
  const role = sanitize(value.role);
  
  // Check for existing user by email or username
  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    return res.status(400).json({ error: 'User with this email or username already exists' });
  }
  
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({ username, email, password: hashedPassword, role });
  res.status(201).json({ 
    id: user._id, 
    username: user.username, 
    email: user.email, 
    role: user.role 
  });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed', details: err.message });
  }
};

exports.login = async (req, res) => {
  /**
   * Login user and return JWT token
   * @route POST /users/login
   * @param {string} email
   * @param {string} password
   * @returns {Object} JWT token
   */
  try {
    // Validate input
    await body('email').isEmail().normalizeEmail().run(req);
    await body('password').isLength({ min: 6 }).run(req);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Sanitize input
    const email = sanitize(req.body.email);
    const password = sanitize(req.body.password);
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ 
      id: user._id, 
      username: user.username, 
      email: user.email,
      role: user.role 
    }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        username: user.username, 
        email: user.email, 
        role: user.role 
      } 
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed', details: err.message });
  }
};

exports.getProfile = async (req, res) => {
  /**
   * Get user profile by ID
   * @route GET /users/:id
   * @param {string} id
   * @returns {Object} User profile
   */
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get profile', details: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  /**
   * Update user profile by ID
   * @route PUT /users/:id
   * @param {string} id
   * @param {string} [username]
   * @param {string} [email]
   * @param {string} [role]
   * @returns {Object} Updated user profile
   */
  try {
    const { username, email, role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.username = username || user.username;
    user.email = email || user.email;
    user.role = role || user.role;
    await user.save();
    res.json({ id: user._id, username: user.username, email: user.email, role: user.role });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile', details: err.message });
  }
};

// Get all users (secured, paginated)
exports.getAllUsers = async (req, res) => {
  /**
   * Get all users (paginated, secured)
   * @route GET /users
   * @param {number} [page]
   * @param {number} [limit]
   * @returns {Object} Paginated users
   */
  try {
    // Pagination params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    // Query users
    const users = await User.find().select('-password').skip(skip).limit(limit);
    const total = await User.countDocuments();
    res.json({
      users,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalUsers: total
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get users', details: err.message });
  }
};

