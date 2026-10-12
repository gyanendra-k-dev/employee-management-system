const Employee = require('../models/Employee');
const Department = require('../models/Department');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/dashboard/stats   (admin)
const getStats = asyncHandler(async (req, res) => {
  const [statusCounts, adminCount, departmentCount, byDepartment, recentHires] = await Promise.all([
    Employee.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Employee.countDocuments({ role: 'admin' }),
    Department.countDocuments(),
    Employee.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
      {
        $project: {
          _id: 0,
          name: { $ifNull: [{ $arrayElemAt: ['$dept.name', 0] }, 'Unassigned'] },
          count: 1,
        },
      },
      { $sort: { count: -1 } },
    ]),
    Employee.find().populate('department', 'name').sort({ createdAt: -1 }).limit(5),
  ]);

  const byStatus = { active: 0, on_leave: 0, inactive: 0, terminated: 0 };
  statusCounts.forEach((s) => {
    byStatus[s._id] = s.count;
  });
  const totalEmployees = Object.values(byStatus).reduce((sum, n) => sum + n, 0);

  res.json({
    success: true,
    data: {
      totalEmployees,
      activeEmployees: byStatus.active,
      adminCount,
      departmentCount,
      byStatus,
      byDepartment,
      recentHires,
    },
  });
});

module.exports = { getStats };
