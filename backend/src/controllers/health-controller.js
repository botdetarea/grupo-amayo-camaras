const pool = require('../database/pool');
const asyncHandler = require('../middlewares/async-handler');

const getHealth = asyncHandler(async (request, response) => {
  await pool.query('SELECT 1 AS database_connected');
  response.status(200).json({
    status: 'ok',
    database: 'connected',
  });
});

module.exports = { getHealth };
