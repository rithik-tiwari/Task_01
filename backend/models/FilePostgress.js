const { DataTypes } = require('sequelize');
const sequelize = require('../config/databasepostgress'); 
const FilePostgress = sequelize.define('File', {
  
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







