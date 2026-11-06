-- Adds nullable event IDs without changing or deleting existing records.
-- Existing rows remain NULL; MariaDB/MySQL permit multiple NULLs in a unique index.
-- New API writers must supply a UUID and handle duplicate-key error 1062 as a replay.

SET @asistencia_event_column_exists = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'asistencias'
    AND column_name = 'evento_id'
);
SET @asistencia_event_column_sql = IF(
  @asistencia_event_column_exists = 0,
  'ALTER TABLE asistencias ADD COLUMN evento_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL AFTER registrado_por',
  'SELECT ''asistencias.evento_id already exists'''
);
PREPARE add_asistencia_event_column FROM @asistencia_event_column_sql;
EXECUTE add_asistencia_event_column;
DEALLOCATE PREPARE add_asistencia_event_column;

SET @asistencia_event_index_exists = (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'asistencias'
    AND index_name = 'uq_asistencias_evento_id'
);
SET @asistencia_event_index_sql = IF(
  @asistencia_event_index_exists = 0,
  'ALTER TABLE asistencias ADD UNIQUE INDEX uq_asistencias_evento_id (evento_id)',
  'SELECT ''uq_asistencias_evento_id already exists'''
);
PREPARE add_asistencia_event_index FROM @asistencia_event_index_sql;
EXECUTE add_asistencia_event_index;
DEALLOCATE PREPARE add_asistencia_event_index;

SET @visita_event_column_exists = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'visitas'
    AND column_name = 'evento_id'
);
SET @visita_event_column_sql = IF(
  @visita_event_column_exists = 0,
  'ALTER TABLE visitas ADD COLUMN evento_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL AFTER dispositivo_id',
  'SELECT ''visitas.evento_id already exists'''
);
PREPARE add_visita_event_column FROM @visita_event_column_sql;
EXECUTE add_visita_event_column;
DEALLOCATE PREPARE add_visita_event_column;

SET @visita_event_index_exists = (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'visitas'
    AND index_name = 'uq_visitas_evento_id'
);
SET @visita_event_index_sql = IF(
  @visita_event_index_exists = 0,
  'ALTER TABLE visitas ADD UNIQUE INDEX uq_visitas_evento_id (evento_id)',
  'SELECT ''uq_visitas_evento_id already exists'''
);
PREPARE add_visita_event_index FROM @visita_event_index_sql;
EXECUTE add_visita_event_index;
DEALLOCATE PREPARE add_visita_event_index;
