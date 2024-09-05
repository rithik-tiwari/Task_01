// postgresqlInsert.js
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      dialect: 'postgres',
      dialectOptions: {
        statement_timeout: 10000,
      },
      port: process.env.DB_PORT
    },
  );
  const File = sequelize.define('File', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    po_number: Sequelize.INTEGER,
    container_no: Sequelize.INTEGER,
    hscode: Sequelize.STRING,
    material_code: Sequelize.STRING,
    material_name: Sequelize.STRING,
    quantity: Sequelize.INTEGER,
    quantity_unit: Sequelize.INTEGER,
    net_weight: Sequelize.INTEGER,
    gross_weight: Sequelize.INTEGER,
    weight_unit: Sequelize.INTEGER,
    volume: Sequelize.INTEGER,
    volume_unit: Sequelize.INTEGER,
    invoice_number: Sequelize.INTEGER,
    pallet_no: Sequelize.INTEGER,
    //  created_at: {
    //    type: Sequelize.DATE,
    //    defaultValue: Sequelize.NOW,  //Ensure this line is present
    //  },
    //  updated_at: {
    //      type: Sequelize.DATE,
    //      defaultValue: Sequelize.NOW,  //Ensure this line is present
    //    }
  }, {
    timestamps: false// If you're managing timestamps manually
  });
async function insertIntoPostgreSQL(data) {
  try {
    await sequelize.sync(); // Ensure the table exists
    await File.bulkCreate(data.map(row => ({
      id: row.id,
      po_number: row.po_number,
      container_no: row.container_no,
      hscode: row.hscode,
      material_code: row.material_code,
      material_name: row.material_name,
      quantity: row.quantity,
      quantity_unit: row.quantity_unit,
      net_weight: row.net_weight,
      gross_weight: row.gross_weight,
      weight_unit: row.weight_unit,
      volume: row.volume,
      volume_unit: row.volume_unit,
      invoice_number: row.invoice_number,
      pallet_no: row.pallet_no,
    // created_at: new Date(row.created_at),
    // updated_at: new Date(row.updated_at)
    })));
    console.log('Data inserted into PostgreSQL successfully');
  } catch (error) {
    console.error('Error inserting data into PostgreSQL:', error);
  }
}
module.exports = insertIntoPostgreSQL;