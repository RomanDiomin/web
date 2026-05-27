const mysql = require("mysql2/promise");
const dotenv = require("dotenv");

dotenv.config();

const dbName = process.env.DB_NAME || "task_manager";

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: dbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function initDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || ""
  });

  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await connection.end();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      status ENUM('new', 'in_progress', 'done') NOT NULL DEFAULT 'new',
      repeat_type ENUM('none', 'daily') NOT NULL DEFAULT 'none',
      reminder_time TIME NULL,
      due_at DATETIME NULL,
      deadline_notified_at DATETIME NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_tasks_user_created (user_id, created_at),
      CONSTRAINT fk_tasks_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
    )
  `);

  await migrateLegacyTasksTable();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS task_notes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      task_id INT NOT NULL,
      body TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_task_notes_task_created (task_id, created_at),
      CONSTRAINT fk_task_notes_task
        FOREIGN KEY (task_id) REFERENCES tasks(id)
        ON DELETE CASCADE
    )
  `);
}

/**
 * Старі інсталяції могли мати tasks без user_id — CREATE IF NOT EXISTS не оновлює схему.
 * Додаємо колонку; рядки без власника видаляються (їх неможливо прив'язати до JWT).
 */
async function migrateLegacyTasksTable() {
  const [cols] = await pool.query(
    `SELECT COLUMN_NAME AS name FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'tasks'`,
    [dbName]
  );
  const names = new Set(cols.map((row) => row.name));
  if (!names.has("user_id")) {
    await pool.query(`ALTER TABLE tasks ADD COLUMN user_id INT NULL`);
    await pool.query(`DELETE FROM tasks WHERE user_id IS NULL`);
    await pool.query(
      `ALTER TABLE tasks MODIFY COLUMN user_id INT NOT NULL`
    );

    try {
      await pool.query(
        `ALTER TABLE tasks ADD INDEX idx_tasks_user_created (user_id, created_at)`
      );
    } catch {
      /* індекс уже є */
    }

    try {
      await pool.query(`
        ALTER TABLE tasks
        ADD CONSTRAINT fk_tasks_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      `);
    } catch {
      /* обмеження вже є */
    }
  }

  if (!names.has("repeat_type")) {
    await pool.query(
      `ALTER TABLE tasks ADD COLUMN repeat_type ENUM('none', 'daily') NOT NULL DEFAULT 'none'`
    );
  }

  if (!names.has("reminder_time")) {
    await pool.query(
      `ALTER TABLE tasks ADD COLUMN reminder_time TIME NULL`
    );
  }

  if (!names.has("due_at")) {
    await pool.query(
      `ALTER TABLE tasks ADD COLUMN due_at DATETIME NULL`
    );
  }

  if (!names.has("deadline_notified_at")) {
    await pool.query(
      `ALTER TABLE tasks ADD COLUMN deadline_notified_at DATETIME NULL`
    );
  }

  console.warn(
    "[db] Migrated tasks table for ownership/reminders/deadlines compatibility."
  );
}

module.exports = {
  pool,
  initDatabase
};
