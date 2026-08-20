// Express doesn't catch rejected promises thrown inside async route
// handlers. Left alone, a failed db query crashes the whole Node process
// (Railway then shows "Application failed to respond" for every route,
// not just the one that failed). Wrapping every async handler in this
// forwards the error to Express's error-handling middleware instead.
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { asyncHandler };
