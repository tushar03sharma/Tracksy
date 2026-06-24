const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      // No longer required — Google users don't have a password
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    // Stores the unique ID Google gives this user — null for email/password users
    googleId: {
      type: String,
      default: null,
    },
    // Which method was used to create the account
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    avatar: {
      type: String, // Google profile picture URL
      default: null,
    },
  },
  { timestamps: true }
);

// Hash password before saving — skip if no password (Google users)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare candidate password with stored hash
userSchema.methods.correctPassword = async function (candidatePassword) {
  if (!this.password) return false; // Google users have no password
  return bcrypt.compare(candidatePassword, this.password);
};

// Sign and return a JWT for this user
userSchema.methods.generateToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

module.exports = mongoose.model('User', userSchema);
