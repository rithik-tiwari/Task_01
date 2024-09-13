const { DataTypes } = require('sequelize');
const sequelize = require('../../config/databasepostgress');
const Shipment = require('./shipmentsql');

const Cities = sequelize.define('Cities', {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true,
		allowNull: false,
	},
	referenceId: {
		type: DataTypes.STRING,
		allowNull: false,
	},
});

Cities.hasMany(Shipment, { foreignKey: 'sourceReferenceId' });
Cities.hasMany(Shipment, { foreignKey: 'destinationReferenceId' });

module.exports = Cities;
