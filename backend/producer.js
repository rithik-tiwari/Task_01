const Bull = require('bull');
const AWSS3Wrapper = require('./config/s3config'); 
const Excel = require('./utils/excelRead'); 
const redisClient = new Bull('data-queue', 'redis://127.0.0.1:6379');

// Function to produce job from S3
async function produceJobFromS3(s3Key) {
  try {
    const s3Wrapper = new AWSS3Wrapper();
    const s3Data = await s3Wrapper.getObject(s3Key); // Fetch data from S3
    console.log("🚀 ~ produceJobFromS3 ~ s3Data:", s3Data)

    const excel = new Excel(s3Data.Body); // Assume S3 returns buffer
    const { jsonData, worksheet } = await excel.readExcel();


    // Clean the data
    const cleanedData = excel.cleanData(jsonData);

    // Add the job to the Bull queue
    const job = await redisClient.add({
      cleanedData,
      s3Key
    });

    console.log(`Job added to the queue with id: ${job.id}`);
  } catch (error) {
    console.error('Error producing job:', error.message);
  }
}


module.exports = produceJobFromS3;
