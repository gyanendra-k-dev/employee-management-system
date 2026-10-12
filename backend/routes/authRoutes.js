const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const auth = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { signupRules, loginRules, updateProfileRules, changePasswordRules } = require('../middleware/validators');

// Slow down brute-force attempts on login/signup.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again in 15 minutes.' },
});

router.post('/signup', authLimiter, signupRules, validate, auth.signup);
router.post('/login', authLimiter, loginRules, validate, auth.login);

router.post('/logout', protect, auth.logout);
router.get('/me', protect, auth.getMe);
router.put('/me', protect, updateProfileRules, validate, auth.updateMe);
router.put('/change-password', protect, changePasswordRules, validate, auth.changePassword);

module.exports = router;
