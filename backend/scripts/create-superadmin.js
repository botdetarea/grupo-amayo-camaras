const readline = require('node:readline');
const { createInterface } = require('node:readline/promises');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const pool = require('../src/database/pool');

function readHidden(prompt) {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
    throw new Error('Run this command in an interactive PowerShell or terminal window.');
  }

  readline.emitKeypressEvents(process.stdin);
  const wasRaw = process.stdin.isRaw;
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdout.write(prompt);

  return new Promise((resolve, reject) => {
    let value = '';

    function finish(error) {
      process.stdin.removeListener('keypress', onKeypress);
      process.stdin.setRawMode(wasRaw);
      process.stdout.write('\r\n');
      if (error) {
        reject(error);
      } else {
        resolve(value);
      }
    }

    function onKeypress(character, key) {
      if (key.ctrl && key.name === 'c') {
        finish(new Error('Setup cancelled.'));
      } else if (key.name === 'return' || key.name === 'enter') {
        finish();
      } else if (key.name === 'backspace') {
        value = Array.from(value).slice(0, -1).join('');
      } else if (character && !key.ctrl && !key.meta) {
        value += character;
      }
    }

    process.stdin.on('keypress', onKeypress);
  });
}

async function readLine(prompt) {
  const terminal = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return (await terminal.question(prompt)).trim();
  } finally {
    terminal.close();
  }
}

async function main() {
  const nombre = await readLine('Nombre del superadministrador: ');
  const correo = await readLine('Correo: ');
  const password = await readHidden('Contrasena (no se mostrara): ');
  const confirmation = await readHidden('Repita la contrasena: ');

  const input = z.object({
    nombre: z.string().trim().min(1).max(100),
    correo: z.string().trim().email().max(150),
    password: z.string().min(12).max(72),
  }).safeParse({ nombre, correo, password });

  if (!input.success || Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error('Name, email, or password does not meet the required format.');
  }
  if (password !== confirmation) {
    throw new Error('The passwords do not match.');
  }

  const connection = await pool.getConnection();
  let lockAcquired = false;
  try {
    const [lockRows] = await connection.query(
      "SELECT GET_LOCK('camaras_bootstrap_superadmin', 10) AS lock_acquired",
    );
    lockAcquired = Number(lockRows[0].lock_acquired) === 1;
    if (!lockAcquired) {
      throw new Error('Could not acquire the initial-account setup lock.');
    }

    await connection.beginTransaction();
    const [rows] = await connection.query('SELECT COUNT(*) AS total FROM usuarios');
    if (Number(rows[0].total) !== 0) {
      throw new Error('The usuarios table is not empty; initial superadmin creation is disabled.');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await connection.execute(
      `INSERT INTO usuarios
        (nombre, correo, password_hash, rol, activo, creado_en, actualizado_en)
       VALUES (?, ?, ?, 'superadmin', 1, NOW(), NOW())`,
      [input.data.nombre, input.data.correo, passwordHash],
    );
    await connection.commit();
    console.log(`Initial superadmin created for ${input.data.correo}.`);
  } catch (error) {
    try {
      await connection.rollback();
    } catch {
      console.error('Could not roll back the initial-account transaction.');
    }
    throw error;
  } finally {
    if (lockAcquired) {
      try {
        await connection.query("SELECT RELEASE_LOCK('camaras_bootstrap_superadmin')");
      } catch {
        console.error('Could not release the initial-account setup lock.');
      }
    }
    connection.release();
  }
}

main()
  .catch((error) => {
    console.error(`Superadmin setup failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
