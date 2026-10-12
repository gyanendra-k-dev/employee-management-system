const ROLES = ['admin', 'employee'];
const STATUSES = ['active', 'on_leave', 'inactive', 'terminated'];
// These statuses are not allowed to log in or use an existing token.
const BLOCKED_STATUSES = ['inactive', 'terminated'];

module.exports = { ROLES, STATUSES, BLOCKED_STATUSES };
