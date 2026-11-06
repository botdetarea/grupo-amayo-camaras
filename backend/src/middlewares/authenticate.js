const jwt = require('jsonwebtoken');
const config = require('../config');
const pool = require('../database/pool');
const AppError = require('../errors/app-error');
const asyncHandler = require('./async-handler');

function unauthorized() {
  return new AppError(401, 'unauthorized', 'Authentication is required.');
}

const authenticate = asyncHandler(async (request, response, next) => {
  const authorization = request.get('authorization') || '';
  const match = /^Bearer ([^\s]+)$/i.exec(authorization);

  if (!match) {
    throw unauthorized();
  }

  let claims;
  try {
    claims = jwt.verify(match[1], config.jwt.secret, {
      algorithms: ['HS256'],
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError' || error.name === 'NotBeforeError') {
      throw unauthorized();
    }
    throw error;
  }

  if (!claims || typeof claims !== 'object' || !/^[1-9]\d*$/.test(claims.sub || '')) {
    throw unauthorized();
  }

  const [rows] = await pool.execute(
    'SELECT id, nombre, apellido, correo, rol, activo FROM usuarios WHERE id = ? LIMIT 1',
    [claims.sub],
  );
  const user = rows[0];

  if (!user || Number(user.activo) !== 1) {
    throw unauthorized();
  }

  request.user = {
    id: user.id,
    nombre: user.nombre,
    apellido: user.apellido,
    correo: user.correo,
    rol: user.rol,
  };

  next();
});

module.exports = authenticate;
