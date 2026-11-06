const AppError = require('../errors/app-error');

function authorizeRoles(...allowedRoles) {
  return function authorize(request, response, next) {
    if (!request.user) {
      return next(new AppError(401, 'unauthorized', 'Authentication is required.'));
    }

    if (!allowedRoles.includes(request.user.rol)) {
      return next(new AppError(403, 'forbidden', 'You do not have permission to access this resource.'));
    }

    return next();
  };
}

module.exports = authorizeRoles;
