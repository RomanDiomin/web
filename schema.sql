CREATE DATABASE IF NOT EXISTS task_manager
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE task_manager;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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
  CONSTRAINT fk_tasks_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS task_notes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_task_notes_task_created (task_id, created_at),
  CONSTRAINT fk_task_notes_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);
