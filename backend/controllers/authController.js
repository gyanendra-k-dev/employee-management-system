const Employee = require('../models/Employee');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const generateToken = require('../utils/generateToken');
const { BLOCKED_STATUSES } = require('../utils/constants');

// POST /api/auth/signup   (public)
// Public signup can ONLY create an "employee". Any "role" in the body is ignored.
const signup = asyncHandler(async (req, res) => {
  const { fullName, email, phone, password } = req.body;

  const exists = await Employee.exists({ email });
  if (exists) throw new ApiError(409, 'An account with this email already exists');

  const user = await Employee.create({
    fullName,
    email,
    phone,
    password,
    role: 'employee',
    status: 'active',
  });

  res.status(201).json({ success: true, message: 'Account created', token: generateToken(user), user });
});

// POST /api/auth/login   (public)
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await Employee.findOne({ email })
    .select('+password +tokenVersion')
    .populate('department', 'name');

  // Same message for "no user" and "wrong password" so attackers can't discover which emails exist.
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  if (BLOCKED_STATUSES.includes(user.status)) {
    throw new ApiError(403, 'Your account is not active. Contact your administrator.');
  }

  res.json({ success: true, message: 'Logged in', token: generateToken(user), user });
});

// POST /api/auth/logout   (private)
// JWTs are stateless, so we "invalidate" them by bumping tokenVersion in the database.
const logout = asyncHandler(async (req, res) => {
  await Employee.updateOne({ _id: req.user._id }, { $inc: { tokenVersion: 1 } });
  res.json({ success: true, message: 'Logged out' });
});

// GET /api/auth/me   (private)
const getMe = asyncHandler(async (req, res) => {
  const user = await Employee.findById(req.user._id).populate('department', 'name');
  res.json({ success: true, user });
});

// PUT /api/auth/me   (private)
// Employees may only change these personal fields. Role, status, email, department are NOT here.
const updateMe = asyncHandler(async (req, res) => {
  const updates = {};
  ['fullName', 'phone', 'address'].forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const user = await Employee.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  }).populate('department', 'name');

  res.json({ success: true, message: 'Profile updated', user });
});

// PUT /api/auth/change-password   (private)
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await Employee.findById(req.user._id).select('+password +tokenVersion');
  if (!(await user.comparePassword(currentPassword))) {
    // 400 (not 401) so the frontend doesn't confuse this with an expired session.
    throw new ApiError(400, 'Current password is incorrect');
  }
  if (currentPassword === newPassword) {
    throw new ApiError(400, 'New password must be different from the current password');
  }

  user.password = newPassword; // hashed by the pre-save hook
  user.tokenVersion += 1; // logs out every other device
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully',
    token: generateToken(user), // fresh token for this device
  });
});

module.exports = { signup, login, logout, getMe, updateMe, changePassword };
