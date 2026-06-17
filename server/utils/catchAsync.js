// Wraps async route handlers — eliminates try/catch boilerplate in every controller
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsync;
