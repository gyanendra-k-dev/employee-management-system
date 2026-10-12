const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES, STATUSES } = require('../utils/constants');

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isSelf = (req, id) => String(req.user._id) === String(id);

const assertDepartmentExists = async (departmentId) => {
  if (departmentId && !(await Department.exists({ _id: departmentId }))) {
    throw new ApiError(400, 'Selected department does not exist');
  }
};

// GET /api/employees?search=&department=&status=&role=&page=&limit=
const getEmployees = asyncHandler(async (req, res) => {
  const { search, department, status, role } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);

  const filter = {};
  // typeof checks stop NoSQL-injection tricks like ?status[$ne]=x
  if (typeof search === 'string' && search.trim()) {
    const regex = new RegExp(escapeRegex(search.trim()), 'i');
    filter.$or = [{ fullName: regex }, { email: regex }, { phone: regex }, { designation: regex }];
  }
  if (typeof department === 'string' && mongoose.isValidObjectId(department)) filter.department = department;
  if (typeof status === 'string' && STATUSES.includes(status)) filter.status = status;
  if (typeof role === 'string' && ROLES.includes(role)) filter.role = role;

  const [employees, total] = await Promise.all([
    Employee.find(filter)
      .populate('department', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Employee.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: employees,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

// GET /api/employees/:id
const getEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id).populate('department', 'name');
  if (!employee) throw new ApiError(404, 'Employee not found');
  res.json({ success: true, data: employee });
});

// POST /api/employees
const createEmployee = asyncHandler(async (req, res) => {
  const { fullName, email, phone, password, department, designation, joiningDate, status, role, address } = req.body;

  if (await Employee.exists({ email })) throw new ApiError(409, 'An account with this email already exists');
  await assertDepartmentExists(department);

  const employee = await Employee.create({
    fullName,
    email,
    phone,
    password,
    address,
    department: department || null,
    designation,
    joiningDate: joiningDate || undefined,
    status,
    role, // only admins reach this route, so only admins can assign roles
  });
  await employee.populate('department', 'name');

  res.status(201).json({ success: true, message: 'Employee created', data: employee });
});

// PUT /api/employees/:id
const updateEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id).select('+tokenVersion');
  if (!employee) throw new ApiError(404, 'Employee not found');

  const { fullName, email, phone, address, department, designation, joiningDate, status, role, password } = req.body;

  // An admin must not lock themselves out or demote themselves by accident.
  if (isSelf(req, employee._id)) {
    if (role && role !== employee.role) throw new ApiError(400, 'You cannot change your own role');
    if (status && status !== employee.status) throw new ApiError(400, 'You cannot change your own status');
  }

  if (department !== undefined) {
    await assertDepartmentExists(department);
    employee.department = department || null;
  }
  if (fullName !== undefined) employee.fullName = fullName;
  if (email !== undefined) employee.email = email;
  if (phone !== undefined) employee.phone = phone;
  if (address !== undefined) employee.address = address;
  if (designation !== undefined) employee.designation = designation;
  if (joiningDate) employee.joiningDate = joiningDate;
  if (status !== undefined) employee.status = status;
  if (role !== undefined) employee.role = role;
  if (password) {
    employee.password = password;
    employee.tokenVersion += 1; // force re-login after an admin reset
  }

  await employee.save();
  await employee.populate('department', 'name');

  res.json({ success: true, message: 'Employee updated', data: employee });
});

// PATCH /api/employees/:id/status
const updateEmployeeStatus = asyncHandler(async (req, res) => {
  if (isSelf(req, req.params.id)) throw new ApiError(400, 'You cannot change your own status');

  const employee = await Employee.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true, runValidators: true }
  ).populate('department', 'name');
  if (!employee) throw new ApiError(404, 'Employee not found');

  res.json({ success: true, message: 'Status updated', data: employee });
});

// DELETE /api/employees/:id
const deleteEmployee = asyncHandler(async (req, res) => {
  if (isSelf(req, req.params.id)) throw new ApiError(400, 'You cannot delete your own account');

  const employee = await Employee.findByIdAndDelete(req.params.id);
  if (!employee) throw new ApiError(404, 'Employee not found');

  res.json({ success: true, message: 'Employee deleted' });
});

module.exports = {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  updateEmployeeStatus,
  deleteEmployee,
};
