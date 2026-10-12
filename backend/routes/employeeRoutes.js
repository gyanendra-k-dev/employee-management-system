const router = require('express').Router();
const emp = require('../controllers/employeeController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { mongoIdParam, employeeRules, statusRules } = require('../middleware/validators');

// Every employee-management route requires: logged in (protect) AND admin (authorize).
router.use(protect, authorize('admin'));

router.route('/')
  .get(emp.getEmployees)
  .post(employeeRules(true), validate, emp.createEmployee);

router.route('/:id')
  .get(mongoIdParam, validate, emp.getEmployee)
  .put(mongoIdParam, employeeRules(false), validate, emp.updateEmployee)
  .delete(mongoIdParam, validate, emp.deleteEmployee);

router.patch('/:id/status', mongoIdParam, statusRules, validate, emp.updateEmployeeStatus);

module.exports = router;
