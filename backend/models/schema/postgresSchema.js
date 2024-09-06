const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../../config/databasepostgress'); 
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
    type: DataTypes.INTEGER, 
    allowNull: false
  },
  gross_weight: {
    type: DataTypes.INTEGER, 
    allowNull: false
  },
  weight_unit: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  volume: {
    type: DataTypes.INTEGER, 
    allowNull: false
  },
  volume_unit: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  invoice_number: {
    type: DataTypes.INTEGER, 
    allowNull: false
  },
  pallet_no: {
    type: DataTypes.INTEGER, 
    allowNull: false
  },
}, {
  timestamps: false, 
});
module.exports = filePostgres;