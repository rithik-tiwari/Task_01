const express = require('express');
const multer = require('multer');
const Bull = require('bull');
const uuid = require('uuid');
const mongoose = require('mongoose');
const { Pool } = require('pg');
const cors = require('cors');
const S3rver = require('s3rver');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
const sequelize = require('./config/databasepostgress');
const Shipments = require('./models/pgsql/shipmentsql');
const Products = require('./models/mongo/productmongo');
const Cities = require('./models/pgsql/citysql');
require('dotenv').config();
const Excel = require('./utils/excelRead');
const { productValidationSchema } = require('./utils/headerValidation');
const AWSS3Wrapper = require('./config/s3config');
const produceJobFromS3 = require('./producer');
// require('./consumer');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());




// Configure AWS SDK to use fake S3
const s3 = new AWS.S3({
  accessKeyId: 'S3RVER',
  secretAccessKey: 'S3RVER',
  endpoint: 'http://localhost:4569',
  s3ForcePathStyle: true,
  signatureVersion: 'v4'
});



// Setup Multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Create the bucket once when the server starts
const s3Wrapper = new AWSS3Wrapper();
s3Wrapper.createBucket();



function generateUniqueS3Key(originalFileName) {
  console.log(originalFileName);
  const uniqueSuffix = Math.floor(10000 + Math.random() * 90000); // Generate a unique 5-digit number
  const baseFileName = originalFileName.split('.')[0]; // Get the base file name (without extension)
  const fileExtension = originalFileName.split('.').pop(); // Get file extension
  const nameFile = `${baseFileName}-${uniqueSuffix}.${fileExtension}`; 
  console.log(nameFile);// Combine base name, unique key, and extension
  return nameFile;
}

// Configure Bull queue
const postgresQueue = new Bull('postgresQueue');
const mongoQueue = new Bull('mongoQueue');

// Database connections
const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  console.error('MONGODB_URI is not set in the environment variables');
  process.exit(1);
}


mongoose.connect(mongoUri);

mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');
});


sequelize.authenticate()
  .then(() => {
    console.log('PostgreSQL database & tables created !!');
  })
  .catch(err => {
    console.error('Unable to connect to the postgresql database : ', err);
  });


app.post('/api', async (req, res) => {
  res.status(200).send('ok');
})

app.use(express.static('public'));
// File upload route
app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }

  try {
    const excel = new Excel(req.file);
    const { jsonData, worksheet } = await excel.readExcel();

    const areHeadersValid = excel.matchHeaders(worksheet);
    if (!areHeadersValid) {
      return res.status(400).json({ message: 'Invalid headers in the file' });
    }

    const cleanedData = excel.cleanData(jsonData);
    const cleanedDataString = JSON.stringify(cleanedData); // Convert cleaned data to string

    
    const uniqueS3Key = generateUniqueS3Key(req.file.originalname);
    
    // Upload the cleaned data to Fake S3 (either as a new file or overwrite)
    const s3Wrapper = new AWSS3Wrapper(cleanedDataString, req.file.originalname);
    await s3Wrapper.putObject(uniqueS3Key); // Store the data with the unique key

    


    
    produceJobFromS3(uniqueS3Key);
    res.json({
      message: `File ${req.file.originalname} uploaded, validated, and queued for processing.`,
      uniqueS3Key: `${req.file.originalname}.json`
  });  } catch (error) {
    console.error('Error in file upload or processing:', error);
    res.status(500).json({ message: 'Error processing the file.', error: error.message });
  }
});


app.get('/files/sample-file.xlsx', (req, res) => {
  const filePath = path.join(__dirname, 'samplefileexe.xlsx');
  res.download(filePath, 'sample-file.xlsx', (err) => {
    if (err) {
      console.error('Error sending file:', err);
      res.status(500).send('Error downloading file. Please try again.');
    }
  });
});

const bucketName = 'my-bucket'; // Define your bucket name here


// Route to list files in S3 bucket
app.get('/files', async (req, res) => {
  try {
    const params = {
      Bucket: bucketName
    };

    // Fetch the list of objects in the bucket
    const data = await s3.listObjectsV2(params).promise();

    if (!data.Contents || data.Contents.length === 0) {
      return res.status(404).json({ message: 'No files found in the bucket.' });
    }

    // Map the files to the format you want (fileName, lastModified, size)
    const files = await Promise.all(
      data.Contents.map(async (file) => {
        const objectDetails = await s3
          .headObject({
            Bucket: bucketName,
            Key: file.Key,
          })
          .promise();

        return {
          key: file.Key, // The file key (including unique identifier)
          lastModified: file.LastModified, // Timestamp when file was last modified
          size: objectDetails.ContentLength // Size in bytes
        };
      })
    );

    res.json(files); // Send the response in JSON format
  } catch (error) {
    console.error('Error retrieving files from S3:', error);
    res.status(500).send('Error retrieving files from S3.');
  }
});

app.delete('/empty-bucket', async (req, res) => {
  try {
    const params = {
      Bucket: bucketName,
    };

    // List all objects in the bucket
    const data = await s3.listObjectsV2(params).promise();

    if (data.Contents.length === 0) {
      return res.status(200).json({ message: 'The bucket is already empty.' });
    }

    // Delete each object one by one
    for (const file of data.Contents) {
      const deleteParams = {
        Bucket: bucketName,
        Key: file.Key,
      };
      await s3.deleteObject(deleteParams).promise();
    }

    res.status(200).json({ message: 'Bucket emptied successfully.' });
  } catch (error) {
    console.error('Error emptying the bucket:', error);
    res.status(500).json({ message: 'Error emptying the bucket.', error: error.message });
  }
});





// Route to fetch data from PostgreSQL
app.get('/data/postgres', async (req, res) => {
  try {
    const data = await Shipments.findAll();
    res.json(data);
  } catch (error) {
    console.error('Error fetching data from PostgreSQL:', error);
    res.status(500).json({ message: 'Error fetching data from PostgreSQL.', error: error.message });
  }
});

// Route to fetch data from MongoDB
app.get('/data/mongo', async (req, res) => {
  try {
    const data = await Products.find({});
    res.json(data);
    
  } catch (error) {
    console.error('Error fetching data from MongoDB:', error);
    res.status(500).json({ message: 'Error fetching data from MongoDB.', error: error.message });
  }
});

app.get('/data/location', async (req, res) => {
  try {
    const data = await Cities.findAll();
    res.json(data);
  } catch (error) {
    console.log('Error fetching data from Table:', error);
    res.status(500).json({ message: 'Error fetching data from Table:', error: error.message});
  }
});


app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  console.error('Error stack:', err.stack);
  res.status(500).json({
    message: 'An unexpected error occurred',
    error: err.message,
    stack: err.stack
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}).on('error', (err) => {
  console.error('Error starting server:', err);
  console.error('Error stack:', err.stack);
});