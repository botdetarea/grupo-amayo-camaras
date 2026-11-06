const mysql = require('mysql2/promise');
const config = require('../config');

const pool = mysql.createPool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.name,
  waitForConnections: true,
  connectionLimit: config.database.connectionLimit,
  queueLimit: 50,
  enableKeepAlive: true,
  supportBigNumbers: true,
  bigNumberStrings: true,
});

module.exports = pool;
