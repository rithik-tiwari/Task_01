const Bull = require('bull');
const AWS = require('aws-sdk');
const mongoose = require('mongoose');
const sequelize = require('./config/databasepostgress');
const insertIntoMongoDB = require('./models/mongodbInsert');
const insertIntoPostgreSQL = require('./models/postgressInsert');
require('dotenv').config();

const s3 = new AWS.S3({
    accessKeyId: 'S3RVER',
    secretAccessKey: 'S3RVER',
    endpoint: 'http://localhost:4569',
    s3ForcePathStyle: true,
    signatureVersion: 'v4'
});

const bucketName = 'my-bucket';

sequelize.authenticate()
  .then(() => {
    console.log('PostgreSQL database & tables created !!');
  })
  .catch(err => {
    console.error('Unable to connect to the postgresql database : ',err);
  });

// Database connections
const mongoUri = process.env.MONGODB_URI;
console.log("🚀 ~ mongoUri:", mongoUri)

if (!mongoUri) {
    console.error('MONGODB_URI is not set in the environment variables');
    process.exit(1);
}


mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: false,
});

mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB');
});

const postgresQueue = new Bull('postgresQueue');
const mongoQueue = new Bull('mongoQueue');

// PostgreSQL Worker
postgresQueue.process(async (job) => {
  const { filename, data } = job.data;
  const params = { Bucket: bucketName, Key: filename };

  try {
    const s3Object = await s3.getObject(params).promise();
    console.log("��� ~ S3 Object Data:", s3Object.Body.toString());
    const jsonData = JSON.parse(s3Object.Body.toString());
    console.log("��� ~ Parsed JSON Data:", jsonData);

    if (!jsonData || jsonData.length === 0) {
        console.error('The fetched file is empty or could not be parsed as JSON.');
        return;
    }

    await insertIntoPostgreSQL(jsonData);
    console.log(`Data from ${filename} saved to PostgreSQL.`);
  } catch (error) {
    console.error('Error processing file for PostgreSQL:', error);
  }
});

// MongoDB Worker
mongoQueue.process(async (job) => {
    const { filename } = job.data;
    const params = { Bucket: bucketName, Key: filename };
  
    try {
        const s3Object = await s3.getObject(params).promise();
        console.log("🚀 ~ S3 Object Data:", s3Object.Body.toString());

        const jsonData = JSON.parse(s3Object.Body.toString());
        console.log("🚀 ~ Parsed JSON Data:", jsonData);

        if (!jsonData || jsonData.length === 0) {
            console.error('The fetched file is empty or could not be parsed as JSON.');
            return;
        }

        await insertIntoMongoDB(jsonData);
        console.log(`Data from ${filename} saved to MongoDB in bulk.`);
    } catch (error) {
        console.error('Error processing file for MongoDB:', error);
    }
});
