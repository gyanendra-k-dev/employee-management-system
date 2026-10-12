const Department = require('../models/Department');
const Employee = require('../models/Employee');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// Trim, remove empty values, and remove duplicates (case-insensitive).
const cleanDesignations = (list = []) => {
  const seen = new Set();
  return list
    .map((d) => String(d).trim())
    .filter((d) => {
      const key = d.toLowerCase();
      if (!d || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

// GET /api/departments  -> each department includes its employeeCount
const getDepartments = asyncHandler(async (req, res) => {
  const [departments, counts] = await Promise.all([
    Department.find().sort({ name: 1 }).lean(),
    Employee.aggregate([{ $group: { _id: '$department', count: { $sum: 1 } } }]),
  ]);

  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
  const data = departments.map((d) => ({ ...d, employeeCount: countMap.get(String(d._id)) || 0 }));

  res.json({ success: true, data });
});

// POST /api/departments
const createDepartment = asyncHandler(async (req, res) => {
  const { name, designations } = req.body;
  const department = await Department.create({ name, designations: cleanDesignations(designations) });
  res.status(201).json({ success: true, message: 'Department created', data: department });
});

// PUT /api/departments/:id
const updateDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) throw new ApiError(404, 'Department not found');

  if (req.body.name !== undefined) department.name = req.body.name;
  if (req.body.designations !== undefined) department.designations = cleanDesignations(req.body.designations);

  await department.save();
  res.json({ success: true, message: 'Department updated', data: department });
});

// DELETE /api/departments/:id
const deleteDepartment = asyncHandler(async (req, res) => {
  const inUse = await Employee.countDocuments({ department: req.params.id });
  if (inUse > 0) {
    throw new ApiError(409, `Cannot delete: ${inUse} employee(s) still belong to this department`);
  }

  const department = await Department.findByIdAndDelete(req.params.id);
  if (!department) throw new ApiError(404, 'Department not found');

  res.json({ success: true, message: 'Department deleted' });
});

module.exports = { getDepartments, createDepartment, updateDepartment, deleteDepartment };
