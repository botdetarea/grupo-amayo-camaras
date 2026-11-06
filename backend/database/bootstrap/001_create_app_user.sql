-- Before execution, replace the password placeholder with a unique random secret.
-- Run only against the existing camaras database. This creates no tables and deletes no data.
-- The account is restricted to local TCP and has no schema-management or DELETE privileges.

CREATE USER IF NOT EXISTS 'camaras_app'@'127.0.0.1'
  IDENTIFIED BY 'REPLACE_WITH_A_UNIQUE_RANDOM_PASSWORD';

GRANT SELECT, INSERT, UPDATE ON camaras.*
  TO 'camaras_app'@'127.0.0.1';
