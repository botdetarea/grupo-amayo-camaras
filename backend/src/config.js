const path = require('node:path');
const dotenv = require('dotenv');
const { z } = require('zod');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DB_HOST: z.string().trim().min(1, 'DB_HOST is required'),
  DB_PORT: z.coerce.number().int().min(1).max(65535).default(3306),
  DB_USER: z.string().trim().min(1, 'DB_USER is required'),
  DB_PASSWORD: z.string().default(''),
  DB_NAME: z.string().trim().min(1).default('camaras'),
  DB_CONNECTION_LIMIT: z.coerce.number().int().min(1).max(50).default(10),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must contain at least 32 characters'),
  JWT_EXPIRES_IN: z.string().trim().min(1).default('15m'),
  CORS_ORIGINS: z.string().default(''),
});

const result = environmentSchema.safeParse(process.env);

if (!result.success) {
  const issues = result.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');
  throw new Error(`Invalid backend configuration: ${issues}`);
}

const values = result.data;

module.exports = Object.freeze({
  environment: values.NODE_ENV,
  port: values.PORT,
  database: Object.freeze({
    host: values.DB_HOST,
    port: values.DB_PORT,
    user: values.DB_USER,
    password: values.DB_PASSWORD,
    name: values.DB_NAME,
    connectionLimit: values.DB_CONNECTION_LIMIT,
  }),
  jwt: Object.freeze({
    secret: values.JWT_SECRET,
    expiresIn: values.JWT_EXPIRES_IN,
    issuer: 'grupo-amayo-backend',
    audience: 'grupo-amayo-client',
  }),
  corsOrigins: Object.freeze(
    values.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean),
  ),
});
