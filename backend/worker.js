const Bull = require('bull');
const XLSX = require('xlsx');
const Joi = require('joi');
const mongoose = require('mongoose');
const { Pool } = require('pg');
const AWS = require('aws-sdk');
const fs = require('fs');

const excelQueue = new Bull('excelProcessing');

// Database connections
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const pgPool = new Pool({
  connectionString: process.env.POSTGRES_URI
});

// Configure AWS SDK to use fake S3
const s3 = new AWS.S3({
  accessKeyId: 'S3RVER',
  secretAccessKey: 'S3RVER',
  endpoint: 'http://localhost:4569',
  s3ForcePathStyle: true,
  signatureVersion: 'v4'
});

// Define Mongoose schema
const DataSchema = new mongoose.Schema({
  name: String,
  email: String,
  age: Number,
  // Add more fields as needed
});

const Data = mongoose.model('Data', DataSchema);

// Joi validation schema
const dataSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  age: Joi.number().integer().min(0).max(120).required(),
  // Add more validations as needed
});

excelQueue.process(async (job) => {
  const { fileUrl, originalName } = job.data;

  try {
    // Download file from fake S3
    const s3Params = {
      Bucket: 'my-test-bucket',
      Key: fileUrl.split('/').slice(-2).join('/') // Extract the key from the fileUrl
    };

    const s3Object = await s3.getObject(s3Params).promise();
    const workbook = XLSX.read(s3Object.Body);

    // Assume the first sheet is the one we want
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert sheet to JSON
    const jsonData = XLSX.utils.sheet_to_json(sheet);

    // Process and validate each row
    for (const row of jsonData) {
      try {
        // Validate data
        await dataSchema.validateAsync(row);

        // Data manipulation (example)
        row.age = parseInt(row.age);
        row.name = row.name.toUpperCase();

        // Store in MongoDB
        const mongoData = new Data(row);
        await mongoData.save();

        // Store in PostgreSQL
        const pgQuery = 'INSERT INTO data(name, email, age) VALUES($1, $2, $3)';
        await pgPool.query(pgQuery, [row.name, row.email, row.age]);

      } catch (validationError) {
        console.error(`Validation error for row: ${JSON.stringify(row)}`, validationError);
        // Handle validation errors (e.g., log them, skip the row, etc.)
      }
    }

    console.log(`Processed file: ${originalName}`);
  } catch (error) {
    console.error(`Error processing file: ${originalName}`, error);
    throw error;
  }
});