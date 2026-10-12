const router = require('express').Router();
const dept = require('../controllers/departmentController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { mongoIdParam, departmentRules } = require('../middleware/validators');

router.use(protect, authorize('admin'));

router.route('/')
  .get(dept.getDepartments)
  .post(departmentRules(true), validate, dept.createDepartment);

router.route('/:id')
  .put(mongoIdParam, departmentRules(false), validate, dept.updateDepartment)
  .delete(mongoIdParam, validate, dept.deleteDepartment);

module.exports = router;
