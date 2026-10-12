const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { BLOCKED_STATUSES } = require('../utils/constants');

// AUTHENTICATION: "Who are you?"  -> verifies the JWT and attaches req.user
const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    throw new ApiError(401, 'Not authenticated. Please log in.');
  }

  const token = header.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET); // throws if invalid/expired

  const user = await Employee.findById(decoded.id).select('+tokenVersion');
  if (!user) throw new ApiError(401, 'This account no longer exists.');
  if (user.tokenVersion !== decoded.v) {
    throw new ApiError(401, 'Session expired. Please log in again.');
  }
  if (BLOCKED_STATUSES.includes(user.status)) {
    throw new ApiError(403, 'Your account is not active. Contact your administrator.');
  }

  req.user = user;
  next();
});

// AUTHORIZATION: "What are you allowed to do?" -> checks the role
const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to perform this action.'));
    }
    next();
  };

module.exports = { protect, authorize };
