const app = require('./app');
const config = require('./config');
const pool = require('./database/pool');

const server = app.listen(config.port, () => {
  console.log(`Backend listening on port ${config.port}`);
});

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  console.log(`Received ${signal}; closing the API and database pool.`);

  server.close(async (error) => {
    if (error) {
      console.error('[api] Failed to close the HTTP server cleanly.');
      process.exitCode = 1;
    }

    try {
      await pool.end();
    } catch (poolError) {
      console.error('[api] Failed to close the database pool:', poolError.code || 'unknown');
      process.exitCode = 1;
    }
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
