// postmodel.js
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../../config/databasepostgress'); // Adjust import as needed
const filePostgres = sequelize.define('File', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  po_number: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  container_no: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  hscode: {
    type: DataTypes.STRING,
    allowNull: false
  },
  material_code: {
    type: DataTypes.STRING,
    allowNull: false
  },
  material_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  quantity_unit: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  net_weight: {
    type: DataTypes.INTEGER, // Changed to FLOAT to match the data type
    allowNull: false
  },
  gross_weight: {
    type: DataTypes.INTEGER, // Changed to FLOAT to match the data type
    allowNull: false
  },
  weight_unit: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  volume: {
    type: DataTypes.INTEGER, // Changed to FLOAT to match the data type
    allowNull: false
  },
  volume_unit: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  invoice_number: {
    type: DataTypes.INTEGER, // Changed to STRING to match the data type
    allowNull: false
  },
  pallet_no: {
    type: DataTypes.INTEGER, // Changed to STRING to match the data type
    allowNull: false
  },
  //  created_at: {
  //    type: Sequelize.DATE,
  //    defaultValue: Sequelize.NOW,
  //  },
  //  updated_at: {
  //    type: Sequelize.DATE,
  //    defaultValue: Sequelize.NOW,
  //  }
}, {
  timestamps: false, // Ensure Sequelize handles timestamps automatically
});
module.exports = filePostgres;