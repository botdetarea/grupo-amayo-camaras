const { randomBytes } = require('node:crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const config = require('../config');
const pool = require('../database/pool');
const AppError = require('../errors/app-error');
const asyncHandler = require('../middlewares/async-handler');

const loginSchema = z.object({
  correo: z.string().trim().email().max(150),
  password: z.string()
    .min(1)
    .max(72)
    .refine((password) => Buffer.byteLength(password, 'utf8') <= 72, {
      message: 'Password must be no longer than 72 bytes.',
    }),
});

const dummyPasswordHash = bcrypt.hash(randomBytes(32).toString('hex'), 12);

function publicUser(user) {
  return {
    id: user.id,
    nombre: user.nombre,
    apellido: user.apellido,
    correo: user.correo,
    rol: user.rol,
  };
}

const login = asyncHandler(async (request, response) => {
  const parsed = loginSchema.safeParse(request.body);

  if (!parsed.success) {
    throw new AppError(400, 'validation_error', 'Check the email and password fields.');
  }

  const [rows] = await pool.execute(
    'SELECT id, nombre, apellido, correo, password_hash, rol, activo FROM usuarios WHERE correo = ? LIMIT 1',
    [parsed.data.correo],
  );
  const user = rows[0];
  const passwordMatches = await bcrypt.compare(
    parsed.data.password,
    user ? user.password_hash : await dummyPasswordHash,
  );

  if (!user || Number(user.activo) !== 1 || !passwordMatches) {
    throw new AppError(401, 'invalid_credentials', 'Email or password is incorrect.');
  }

  const token = jwt.sign({}, config.jwt.secret, {
    algorithm: 'HS256',
    subject: String(user.id),
    expiresIn: config.jwt.expiresIn,
    issuer: config.jwt.issuer,
    audience: config.jwt.audience,
  });

  response.status(200).json({
    token,
    token_type: 'Bearer',
    expires_in: config.jwt.expiresIn,
    user: publicUser(user),
  });
});

const getCurrentUser = asyncHandler(async (request, response) => {
  response.status(200).json({ user: publicUser(request.user) });
});

module.exports = { login, getCurrentUser };
