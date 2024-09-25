const { Pool } = require('pg');
const Cities = require('./pgsql/citysql'); 
const Shipments = require('./pgsql/shipmentsql'); 

const pgPool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'mydbpostgress',
  password: 'password',
  port: 5432,
});

async function insertIntoPostgres(data) {
  const client = await pgPool.connect();

  try {
    await client.query('BEGIN');

    let locationMaster = [];

    data.forEach(row => {
      locationMaster.push(row.SourceReferenceID, row.DestinationReferenceID);
    });

    locationMaster = [...new Set(locationMaster)];

    const locationMap = {};

    for (const locationName of locationMaster) {
      const [city] = await Cities.findOrCreate({
        where: { referenceId: locationName },
        defaults: { referenceId: locationName },
      });

      locationMap[locationName] = city.id;
    }

    const shipmentData = data.map(row => ({
      shipmentType: row.ShipmentType,
      orderNumber: row.OrderNumber,
      orderType: row.OrderType,
      sourceReferenceId: locationMap[row.SourceReferenceID], 
      destinationReferenceId: locationMap[row.DestinationReferenceID], 
      primaryMode: row.PrimaryMode,
      expectedDeliveryDate: row.ExpectedDeliveryDate,
      incoterm: row.Incoterm,
      cargoType: row.CargoType,
      materialCode: row.MaterialCode,
      quantity: row.Quantity,
      quantityUnit: row.QuantityUnit,
      shipmentNumber: row.ShipmentNumber || null,
    }));

    await Shipments.bulkCreate(shipmentData, { validate: true });

    await client.query('COMMIT');
    console.log('Data inserted into PostgreSQL successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error inserting data into PostgreSQL:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = insertIntoPostgres;
