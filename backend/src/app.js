const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');
const AppError = require('./errors/app-error');
const errorHandler = require('./middlewares/error-handler');
const adminRoutes = require('./routes/admin-routes');
const authRoutes = require('./routes/auth-routes');
const healthRoutes = require('./routes/health-routes');

const app = express();
const allowedOrigins = new Set(config.corsOrigins);

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    return callback(new AppError(403, 'cors_origin_denied', 'This origin is not allowed.'));
  },
  optionsSuccessStatus: 204,
}));
app.use(express.json({ limit: '32kb' }));

app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

app.use((request, response, next) => {
  next(new AppError(404, 'not_found', 'The requested API route was not found.'));
});
app.use(errorHandler);

module.exports = app;
