const { randomUUID } = require('node:crypto');
const jwt = require('jsonwebtoken');
const { after, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const config = require('../src/config');
const pool = require('../src/database/pool');
const authorizeRoles = require('../src/middlewares/authorize-roles');

after(async () => {
  await pool.end();
});

describe('API integration', () => {
  it('checks the live MySQL connection in /api/health', async () => {
    const response = await request(app).get('/api/health');

    if (response.status !== 200) {
      throw new Error(`Expected MySQL health status 200; received ${response.status}.`);
    }
    if (response.body.status !== 'ok' || response.body.database !== 'connected') {
      throw new Error('Health response did not confirm a live database connection.');
    }
  });

  it('rejects invalid login input', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ correo: 'not-an-email', password: '' });

    if (response.status !== 400 || response.body.error.code !== 'validation_error') {
      throw new Error(`Expected validation error; received HTTP ${response.status}.`);
    }
  });

  it('rejects credentials that do not exist without exposing account details', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        correo: `missing-${randomUUID()}@example.invalid`,
        password: 'a-password-that-is-not-an-account',
      });

    if (response.status !== 401 || response.body.error.code !== 'invalid_credentials') {
      throw new Error(`Expected invalid-credentials response; received HTTP ${response.status}.`);
    }
    if ('token' in response.body || 'user' in response.body) {
      throw new Error('Failed login must not return a token or user record.');
    }
  });

  it('rejects protected requests without a bearer token', async () => {
    const response = await request(app).get('/api/auth/me');

    if (response.status !== 401 || response.body.error.code !== 'unauthorized') {
      throw new Error(`Expected unauthorized response; received HTTP ${response.status}.`);
    }
  });

  it('rejects an expired JWT before querying a user account', async () => {
    const token = jwt.sign({}, config.jwt.secret, {
      algorithm: 'HS256',
      subject: '1',
      expiresIn: -1,
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    });
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    assert.equal(response.status, 401);
    assert.equal(response.body.error.code, 'unauthorized');
  });

  it('verifies a valid JWT and checks its subject against the live database', async () => {
    const token = jwt.sign({}, config.jwt.secret, {
      algorithm: 'HS256',
      subject: '2147483647',
      expiresIn: '1m',
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    });
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    assert.equal(response.status, 401);
    assert.equal(response.body.error.code, 'unauthorized');
  });

  it('protects the real administrative summary route', async () => {
    const response = await request(app).get('/api/admin/summary');

    if (response.status !== 401 || response.body.error.code !== 'unauthorized') {
      throw new Error(`Expected unauthorized response; received HTTP ${response.status}.`);
    }
  });

  it('denies a worker role access to an administrator-only route', () => {
    let forwardedError;
    authorizeRoles('superadmin', 'administrador')(
      { user: { rol: 'trabajador' } },
      {},
      (error) => { forwardedError = error; },
    );

    assert.equal(forwardedError.status, 403);
    assert.equal(forwardedError.code, 'forbidden');
  });
});
