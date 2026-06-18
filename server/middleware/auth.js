const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

// Protect middleware — validates Bearer JWT and attaches req.user
const protect = catchAsync(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) return next(new AppError('You are not logged in.', 401));

  // Verify token (throws JsonWebTokenError or TokenExpiredError on failure)
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // Check user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) return next(new AppError('User no longer exists.', 401));

  req.user = currentUser;
  next();
});

module.exports = { protect };
