const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 auth requests per 15 minutes
  message: {
    success: false,
    message: "Too many authentication or OTP attempts. Please try again in 15 minutes."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 write/submission requests per 15 minutes
  message: {
    success: false,
    message: "Too many submission attempts from this IP. Please try again in 15 minutes."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authLimiter,
  generalWriteLimiter
};
