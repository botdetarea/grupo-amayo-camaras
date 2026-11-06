const express = require('express');
const { getSummary } = require('../controllers/admin-controller');
const authenticate = require('../middlewares/authenticate');
const authorizeRoles = require('../middlewares/authorize-roles');

const router = express.Router();
router.get('/summary', authenticate, authorizeRoles('superadmin', 'administrador'), getSummary);

module.exports = router;
