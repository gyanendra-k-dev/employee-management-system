const jwt = require('jsonwebtoken');

// "v" is the user's tokenVersion. Bumping it in the DB (logout / password change)
// instantly invalidates every token issued before.
const generateToken = (user) =>
  jwt.sign({ id: user._id, v: user.tokenVersion || 0 }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });

module.exports = generateToken;
