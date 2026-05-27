const { DataTypes } = require("sequelize");
const { sequelize } = require("../db_sequelize");
const Task = require("./Task");

const Note = sequelize.define(
  "Note",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    task_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Task,
        key: "id",
      },
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "task_notes",
    timestamps: false,
  }
);

// Establish Associations
Task.hasMany(Note, { foreignKey: "task_id", onDelete: "CASCADE" });
Note.belongsTo(Task, { foreignKey: "task_id" });

module.exports = Note;
