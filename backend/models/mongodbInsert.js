const Product = require('./mongo/productmongo'); 
const Location = require('./mongo/locationmongo'); 

async function insertIntoMongoDB(data) {
  try {
    let locationMaster = [];

    data.forEach(row => {
      locationMaster.push(row.SourceReferenceID, row.DestinationReferenceID);
    });

    locationMaster = [...new Set(locationMaster)];

    const locationMap = {}; 

    for (let i = 0; i < locationMaster.length; i++) {
      const locationName = locationMaster[i];

      let location = await Location.findOne({ locationName });

      if (!location) {
        location = await Location.create({ locationName });
      }

      locationMap[locationName] = location._id;
    }

    await Product.insertMany(data.map(row => ({
      ShipmentType: row.ShipmentType,
      OrderNumber: row.OrderNumber,
      OrderType: row.OrderType,
      PrimaryMode: row.PrimaryMode,
      ExpectedDeliveryDate: row.ExpectedDeliveryDate,
      Incoterm: row.Incoterm,
      SourceReferenceID: locationMap[row.SourceReferenceID], 
      DestinationReferenceID: locationMap[row.DestinationReferenceID], 
      CargoType: row.CargoType,
      MaterialCode: row.MaterialCode,
      Quantiy: row.Quantiy, 
      QuantityUnit: row.QuantityUnit,
      ShipmentNumber: row.ShipmentNumber || null
    })));

    console.log('Data inserted into MongoDB successfully');
  } catch (error) {
    console.error('Error inserting data into MongoDB:', error);
    throw new Error('Failed to insert data into MongoDB');
  }
}

module.exports = insertIntoMongoDB;
