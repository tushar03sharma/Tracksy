const { body, validationResult } = require('express-validator');

// Reusable validation rules for auth endpoints
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Middleware that reads express-validator results and short-circuits with 400
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'fail',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ─── Job Validators ──────────────────────────────────────────────
const VALID_STATUSES = ['Applied', 'OA', 'Interview', 'Offer', 'Rejected'];

const createJobValidation = [
  body('company').trim().notEmpty().withMessage('Company name is required'),
  body('role').trim().notEmpty().withMessage('Job role is required'),
  body('status').optional().isIn(VALID_STATUSES).withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}`),
  body('jobLink').optional({ checkFalsy: true }).isURL().withMessage('Please provide a valid URL'),
  body('deadline').optional({ checkFalsy: true }).isISO8601().withMessage('Deadline must be a valid date'),
];

const updateJobValidation = [
  body('company').optional().trim().notEmpty().withMessage('Company name cannot be empty'),
  body('role').optional().trim().notEmpty().withMessage('Role cannot be empty'),
  body('status').optional().isIn(VALID_STATUSES).withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}`),
  body('jobLink').optional({ checkFalsy: true }).isURL().withMessage('Please provide a valid URL'),
  body('deadline').optional({ checkFalsy: true }).isISO8601().withMessage('Deadline must be a valid date'),
];

module.exports = {
  registerValidation,
  loginValidation,
  createJobValidation,
  updateJobValidation,
  validate,
};

