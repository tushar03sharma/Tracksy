const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

// Helper — send token + user in response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.generateToken();
  // Remove password from output even though select: false handles queries
  user.password = undefined;
  res.status(statusCode).json({ status: 'success', token, data: { user } });
};

// POST /api/auth/register
const register = catchAsync(async (req, res, next) => {
  const { name, email, password } = req.body;

  // Check if email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) return next(new AppError('Email already registered.', 400));

  const user = await User.create({ name, email, password });
  sendTokenResponse(user, 201, res);
});

// POST /api/auth/login
const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Must select password explicitly (select: false on schema)
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password))) {
    return next(new AppError('Invalid email or password.', 401));
  }

  sendTokenResponse(user, 200, res);
});

// GET /api/auth/me  (protected)
const getMe = catchAsync(async (req, res) => {
  res.status(200).json({ status: 'success', data: { user: req.user } });
});

module.exports = { register, login, getMe };
