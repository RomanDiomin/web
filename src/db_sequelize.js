const { Sequelize } = require("sequelize");
const mysql = require("mysql2/promise");
const dotenv = require("dotenv");

dotenv.config();

const dbName = process.env.DB_NAME || "task_manager";
const dbUser = process.env.DB_USER || "root";
const dbPassword = process.env.DB_PASSWORD || "";
const dbHost = process.env.DB_HOST || "localhost";
const dbPort = Number(process.env.DB_PORT || 3306);

// Pre-sync database creation just like initDatabase in original db.js
async function ensureDatabaseExists() {
  const connection = await mysql.createConnection({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword
  });
  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await connection.end();
}

const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
  dialect: "mysql",
  logging: false,
  define: {
    timestamps: false, // We maintain original table formats
    underscored: true
  }
});

module.exports = {
  sequelize,
  ensureDatabaseExists
};
