const Product = require('./mongo/productmongo'); // Adjust the path to your Product schema
const Location = require('./mongo/locationmongo'); // Adjust the path to your Location schema

async function insertIntoMongoDB(data) {
  try {
    // Step 1: Create a location master array with SourceReferenceID and DestinationReferenceID
    let locationMaster = [];

    data.forEach(row => {
      locationMaster.push(row.SourceReferenceID, row.DestinationReferenceID);
    });

    // Step 2: Remove duplicates
    locationMaster = [...new Set(locationMaster)];

    // Step 3: Create index and insert unique locations into Location table
    const locationMap = {}; // This will store the mapping of location IDs

    for (let i = 0; i < locationMaster.length; i++) {
      const locationName = locationMaster[i];

      // Check if the location already exists in the Location table
      let location = await Location.findOne({ locationName });

      if (!location) {
        // If not, insert the location into the Location collection
        location = await Location.create({ locationName });
      }

      // Map the location name to its ObjectId
      locationMap[locationName] = location._id;
    }

    // Step 4: Now, map the data to the schema fields and insert into MongoDB
    await Product.insertMany(data.map(row => ({
      ShipmentType: row.ShipmentType,
      OrderNumber: row.OrderNumber,
      OrderType: row.OrderType,
      PrimaryMode: row.PrimaryMode,
      ExpectedDeliveryDate: row.ExpectedDeliveryDate,
      Incoterm: row.Incoterm,
      SourceReferenceID: locationMap[row.SourceReferenceID], // Map to the ObjectId from Location
      DestinationReferenceID: locationMap[row.DestinationReferenceID], // Map to the ObjectId from Location
      CargoType: row.CargoType,
      MaterialCode: row.MaterialCode,
      Quantiy: row.Quantiy, // Fix typo: should be Quantity in the schema
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
