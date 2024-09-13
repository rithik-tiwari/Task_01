const Bull = require('bull');
const mongoose = require('mongoose');
const AWSS3Wrapper = require('./config/s3config'); 
const { Pool } = require('pg');
const insertIntoMongoDB = require('./models/mongodbInsert');
const insertIntoPostgres = require('./models/postgressInsert');
const redisClient = new Bull('data-queue', 'redis://127.0.0.1:6379');

// MongoDB connection
const mongoUri = process.env.MONGO_URI;

mongoose.connect(mongoUri);

mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');
});

// PostgreSQL connection pool
const pgPool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'mydbpostgress',
  password: 'password',
  port: 5432,
});

const bucketName = 'my-bucket';

// Process jobs in the queue
redisClient.process(async (job, done) => {
  const { s3Key } = job.data;
  const s3Wrapper = new AWSS3Wrapper();

  try {
    const s3Object = await s3Wrapper.getObject(s3Key);
    console.log("🚀 ~ S3 Object Data fetched successfully");

    const jsonData = JSON.parse(s3Object.Body.toString());
    console.log("🚀 ~ Data converted to JSON successfully");

    if (!jsonData || jsonData.length === 0) {
        console.error('The fetched file is empty or could not be parsed as JSON.');
        return;
    }
    // Insert inot MongoDB
    await insertIntoMongoDB(jsonData);
    console.log('Data inserted into MongoDB');

    // Insert data into PostgreSQL
    const client = await pgPool.connect();
    await insertIntoPostgres(jsonData);
    console.log('Data inserted into postgresSQL')
    

    done();
  } catch (error) {
    console.error('Error processing job:', error.message);
    done(error); // Mark the job as failed
  }
});

console.log('Consumer is waiting for jobs...');
