const mongoose = require('mongoose');
/**
 * User Model
 * Represents a user in the system.
 * @typedef {Object} User
 * @property {string} username - Unique username
 * @property {string} email - Unique email address
 * @property {string} password - Hashed password
 * @property {string} role - User role (default: candidate)
 */

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'candidate' }
});

module.exports = mongoose.model('User', userSchema);

