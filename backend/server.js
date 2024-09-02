const express = require('express');
const multer = require('multer');
const Bull = require('bull');
const mongoose = require('mongoose');
const { Pool } = require('pg');
const cors = require('cors');
const S3rver = require('s3rver');
const XLSX = require('xlsx');
const File = require('./datamongo/data');
const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
require('dotenv').config();
const fileSchema = require('./joi_validatioin/valid')

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Start fake S3 server
const s3rver = new S3rver({
  port: 4569,
  hostname: 'localhost',
  silent: false,
  directory: './fake-s3-storage'
});

// s3rver.run((err) => {
//   if (err) {
//     console.error('Error starting fake S3 server', err);
//   } else {
//     console.log('Fake S3 server is running on port 4569');
//   }
// });

// Configure AWS SDK to use fake S3
const s3 = new AWS.S3({
  accessKeyId: 'S3RVER',
  secretAccessKey: 'S3RVER',
  endpoint: 'http://localhost:4569',
  s3ForcePathStyle: true,
  signatureVersion: 'v4'
});

// Create a bucket if it doesn't exist
const bucketName = 'my-bucket';
s3.createBucket({ Bucket: bucketName }, (err) => {
  if (err && err.code !== 'BucketAlreadyOwnedByYou') {
    console.error('Error creating S3 bucket', err);
  } else {
    console.log(`Bucket '${bucketName}' is ready`);
  }
});

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'file') {
      cb(null, true);
    } else {
      cb(new multer.MulterError('Unexpected field'), false);
    }
  }
});

// Configure Bull queue
const excelQueue = new Bull('excelProcessing');

// Database connections
const mongoUri = process.env.MONGODB_URI;
const postgresUri = process.env.POSTGRES_URI;

if (!mongoUri) {
  console.error('MONGODB_URI is not set in the environment variables');
  process.exit(1);
}

if (!postgresUri) {
  console.error('POSTGRES_URI is not set in the environment variables');
  process.exit(1);
}
//mongoose connection
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// mongoose.connect(mongoUri)
//   .then(() => console.log('Connected to MongoDB'))
//   .catch(err => {
//     console.error('Failed to connect to MongoDB', err);
//     process.exit(1);
//   });

const pgPool = new Pool({ connectionString: postgresUri });
// pgPool.connect()
//   .then(() => console.log('Connected to PostgreSQL'))
//   .catch(err => {
//     console.error('Failed to connect to PostgreSQL', err);
//     process.exit(1);
//   });
app.post('/api', async (req, res) => {
  res.status(200).send('ok');
})
// File upload route
app.post('/upload', upload.single('file'), async (req, res) => {
  if (req.fileValidationError) {
    return res.status(400).json({ message: req.fileValidationError });
  }
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }
  try {
    const params = {
      Bucket: 'my-bucket',
      Key: req.file.originalname,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };

    // Upload file to S3
    await s3.upload(params).promise();
    console.log(`File uploaded: ${req.file.originalname}`);

    // Read and parse the Excel file from buffer
    const workbook = XLSX.read(req.file.buffer);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);
    console.log('Parsed data:', data);

    // Validate and save each row of data to MongoDB
    // for (const row of data) {
    //   const { value, error } = fileSchema.validate(row);
    //   if (error) {
    //     console.error('Validation error:', error.details);
    //     continue;
    //   }
    //   await File.create({
    //     name: req.file.originalname,
    //     data: row
    //   });
    // }
    const bulkOps = [];
    for (const row of data) {
      const { error } = fileSchema.validate(row);
      if (error) {
        console.error('Validation error:', error.details.map(detail => detail.message).join(', '));
        continue;
      }
      bulkOps.push({
        updateOne: {
          filter: { name: row.name }, // or other unique identifier
          update: { $set: { data: row } },
          upsert: true
        }
      });
    }

    res.json({ message: `File ${req.file.originalname} uploaded, data validated, converted to JSON, and saved successfully.` });
  } catch (error) {
    console.error('Error in file upload or processing:', error);
    res.status(500).json({ message: 'Error processing the file.', error: error.message });
  }
});


// Route to list files in S3 bucket
app.get('/files', async (req, res) => {
  try {
    const params = {
      Bucket: 'my-bucket' // Replace with your bucket name
    };
    const data = await s3.listObjects(params).promise();
    const files = data.Contents.map(file => ({
      key: file.Key,
      lastModified: file.LastModified,
      size: file.Size
    }));
    res.json(files);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error retrieving files from S3.');
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