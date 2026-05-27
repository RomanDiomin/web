const { DataTypes } = require("sequelize");
const { sequelize } = require("../db_sequelize");
const User = require("./User");

const Task = sequelize.define(
  "Task",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("new", "in_progress", "done"),
      allowNull: false,
      defaultValue: "new",
    },
    repeat_type: {
      type: DataTypes.ENUM("none", "daily"),
      allowNull: false,
      defaultValue: "none",
    },
    reminder_time: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    due_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deadline_notified_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "tasks",
    timestamps: false,
  }
);

// Establish Associations
User.hasMany(Task, { foreignKey: "user_id", onDelete: "CASCADE" });
Task.belongsTo(User, { foreignKey: "user_id" });

module.exports = Task;
