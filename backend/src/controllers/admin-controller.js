const pool = require('../database/pool');
const asyncHandler = require('../middlewares/async-handler');

const getSummary = asyncHandler(async (request, response) => {
  const [rows] = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM empleados) AS total_empleados,
      (SELECT COUNT(*) FROM empleados WHERE activo = 1) AS empleados_activos,
      (SELECT COUNT(*) FROM asistencias
        WHERE fecha_hora >= CURDATE()
          AND fecha_hora < DATE_ADD(CURDATE(), INTERVAL 1 DAY)) AS asistencias_hoy,
      (SELECT COUNT(*) FROM dispositivos) AS total_dispositivos,
      (SELECT COUNT(*) FROM dispositivos WHERE estado = 'activo') AS dispositivos_activos
  `);

  response.status(200).json({
    resumen: Object.fromEntries(
      Object.entries(rows[0]).map(([key, value]) => [key, Number(value)]),
    ),
  });
});

module.exports = { getSummary };
