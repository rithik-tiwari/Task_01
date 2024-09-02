// models/File.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/databasepostgress'); // Adjust path as necessary
const FilePostgress = sequelize.define('File', {
  // Define columns
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  data: {
    type: DataTypes.JSONB,
    allowNull: false
  }
});
module.exports = FilePostgress;







