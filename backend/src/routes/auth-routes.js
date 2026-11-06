const express = require('express');
const rateLimit = require('express-rate-limit');
const { getCurrentUser, login } = require('../controllers/auth-controller');
const authenticate = require('../middlewares/authenticate');

const router = express.Router();
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    error: {
      code: 'rate_limit_exceeded',
      message: 'Too many login attempts. Try again later.',
    },
  },
});

router.post('/login', loginLimiter, login);
router.get('/me', authenticate, getCurrentUser);

module.exports = router;
