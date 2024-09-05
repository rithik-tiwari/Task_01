// mongodbInsert.js
const mongoose = require('mongoose');
require('dotenv').config();
const mongoFile = require('./schema/mongoSchema'); // Your Mongoose model

async function insertIntoMongoDB(data) {
  try {
    await mongoFile.insertMany(data.map(row => ({
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
      // createdAt: new Date(row.createdAt),
      // updatedAt: new Date(row.updatedAt)
    })));
    console.log('Data inserted into MongoDB successfully');
  } catch (error) {
    console.error('Error inserting data into MongoDB:', error);
  }
}
module.exports = insertIntoMongoDB;




