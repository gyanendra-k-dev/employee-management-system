const { body, param } = require('express-validator');
const { ROLES, STATUSES } = require('../utils/constants');

const PHONE_REGEX = /^[0-9+\-\s()]{7,15}$/;

const passwordRules = (field, optional = false) => {
  const chain = optional ? body(field).optional({ values: 'falsy' }) : body(field);
  return chain
    .isString().withMessage('Password is required').bail()
    .isLength({ min: 8, max: 64 }).withMessage('Password must be 8-64 characters')
    .matches(/[A-Za-z]/).withMessage('Password must contain at least one letter')
    .matches(/\d/).withMessage('Password must contain at least one number');
};

const mongoIdParam = param('id').isMongoId().withMessage('Invalid ID');

// ---------- Auth ----------
const signupRules = [
  body('fullName').trim().isLength({ min: 2, max: 80 }).withMessage('Full name must be 2-80 characters'),
  body('email').trim().toLowerCase().isEmail().withMessage('Enter a valid email'),
  body('phone').trim().matches(PHONE_REGEX).withMessage('Enter a valid phone number'),
  passwordRules('password'),
];

const loginRules = [
  body('email').trim().toLowerCase().isEmail().withMessage('Enter a valid email'),
  body('password').isString().withMessage('Password is required').bail().notEmpty().withMessage('Password is required'),
];

const updateProfileRules = [
  body('fullName').optional().trim().isLength({ min: 2, max: 80 }).withMessage('Full name must be 2-80 characters'),
  body('phone').optional().trim().matches(PHONE_REGEX).withMessage('Enter a valid phone number'),
  body('address').optional().trim().isLength({ max: 200 }).withMessage('Address must be at most 200 characters'),
];

const changePasswordRules = [
  body('currentPassword').isString().withMessage('Current password is required').bail().notEmpty().withMessage('Current password is required'),
  passwordRules('newPassword'),
];

// ---------- Employees (admin) ----------
const employeeRules = (isCreate) => {
  const f = (name) => (isCreate ? body(name) : body(name).optional());
  return [
    f('fullName').trim().isLength({ min: 2, max: 80 }).withMessage('Full name must be 2-80 characters'),
    f('email').trim().toLowerCase().isEmail().withMessage('Enter a valid email'),
    f('phone').trim().matches(PHONE_REGEX).withMessage('Enter a valid phone number'),
    isCreate ? passwordRules('password') : passwordRules('password', true),
    body('department').optional({ values: 'falsy' }).isMongoId().withMessage('Invalid department'),
    body('designation').optional().trim().isLength({ max: 60 }).withMessage('Designation must be at most 60 characters'),
    body('joiningDate').optional({ values: 'falsy' }).isISO8601().withMessage('Enter a valid joining date'),
    body('status').optional().isIn(STATUSES).withMessage(`Status must be one of: ${STATUSES.join(', ')}`),
    body('role').optional().isIn(ROLES).withMessage(`Role must be one of: ${ROLES.join(', ')}`),
  ];
};

const statusRules = [
  body('status').isIn(STATUSES).withMessage(`Status must be one of: ${STATUSES.join(', ')}`),
];

// ---------- Departments ----------
const departmentRules = (isCreate) => [
  (isCreate ? body('name') : body('name').optional())
    .trim()
    .isLength({ min: 2, max: 60 })
    .withMessage('Department name must be 2-60 characters'),
  body('designations').optional().isArray({ max: 30 }).withMessage('Designations must be a list (max 30)'),
  body('designations.*').isString().trim().isLength({ min: 1, max: 60 }).withMessage('Each designation must be 1-60 characters'),
];

module.exports = {
  mongoIdParam,
  signupRules,
  loginRules,
  updateProfileRules,
  changePasswordRules,
  employeeRules,
  statusRules,
  departmentRules,
};
