const { body, param, query, validationResult } = require('express-validator');

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  next();
};

// User validation rules
const validateUser = [
  body('fullName').notEmpty().withMessage('Full name is required'),
  body('userName').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['admin', 'manager', 'employee']).withMessage('Invalid role'),
  body('email').isEmail().withMessage('Valid email is required'),
  handleValidationErrors,
];

// Evaluation validation rules
const validateEvaluation = [
  body('evaluateeId').isInt().withMessage('Valid evaluatee ID is required'),
  body('evaluatorId').isInt().withMessage('Valid evaluator ID is required'),
  body('criteriaId').isInt().withMessage('Valid criteria ID is required'),
  body('score').isFloat({ min: 0, max: 100 }).withMessage('Score must be between 0 and 100'),
  handleValidationErrors,
];

// Employee validation rules
const validateEmployee = [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').isMobilePhone().withMessage('Valid phone number is required'),
  handleValidationErrors,
];

// ID parameter validation
const validateId = [
  param('id').isInt().withMessage('Valid ID is required'),
  handleValidationErrors,
];

module.exports = {
  validateUser,
  validateEvaluation,
  validateEmployee,
  validateId,
  handleValidationErrors,
};
