/**
 * Reusable async wrapper for Express route handlers to eliminate try/catch boilerplates.
 * Automatically catches any exceptions and passes them to next(error).
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
