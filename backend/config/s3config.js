const AWS = require('aws-sdk');
const uuid = require('uuid');
// Configure the AWS SDK to use FakeS3
const s3 = new AWS.S3({
    endpoint: 'http://localhost:4569', // Replace with your FakeS3 endpoint if different
    s3ForcePathStyle: true, // Required for FakeS3
    accessKeyId: 'fakes3', // FakeS3 doesn't enforce real AWS credentials  
    secretAccessKey: 'fakes3',
    signatureVersion: 'v4',
});

// Example bucket name and object key

const bucketName = 'my-bucket';

class AWSS3Wrapper {

    constructor(data, filename) {
        //console.log(data) ;
        this.stringData = data;
        this.key = uuid.v4();
        this.name = filename;
    }

    async checkIfObjectExists(KEY) {
        try {
            await s3.headObject({
                Bucket: bucketName,
                Key: KEY,
            }).promise();
            return true;
        } catch (err) {
            if (err.code === 'NotFound') {
                return false;
            }
            throw err;
        }
    }

    async createBucket() {
        try {

            const data = await s3.createBucket({ Bucket: bucketName }).promise();
            console.log('Bucket created');
        } catch (err) {
            console.log(err);
        }
    }

    async getObjectDetails(name) {
        try {
            const objectData = await s3
                .headObject({
                    Bucket: bucketName,
                    Key: name
                })
                .promise();

            return objectData;
        } catch (error) {
            console.log('Error fetching object details from S3:', error);
            throw new Error('Failed to fetch object details.');
        }
    }


    async putObject(KEY) {
        try {
            // Check if object already exists in S3
            const exists = await this.checkIfObjectExists(KEY);
            if (exists) {
                console.log(`Object with key ${KEY} already exists. updating the file.`);
                // Fetch the object's details (e.g., lastModified, size) if it exists
                const objectDetails = await this.getObjectDetails(this.name);
                return {
                    //   message: `Object with key ${this.key} already exists. Overwriting the file.`,
                    fileName: KEY,
                    lastModified: objectDetails.LastModified,
                    size: objectDetails.ContentLength
                };
            }

            // Upload the object to S3
            await s3
                .putObject({
                    Bucket: bucketName,
                    Key: KEY,
                    Body: this.stringData,
                })
                .promise();

            console.log(KEY);
            console.log('Object stored in S3 successfully');

            // Fetch the object's details after upload
            const objectDetails = await this.getObjectDetails(this.name);

            return {
                // message: 'Object stored in S3 successfully',
                fileName: this.name,
                lastModified: objectDetails.LastModified,
                size: objectDetails.ContentLength
            };
        } catch (error) {
            console.log('Failed to push object in S3', error);
            throw new Error('Error in putting object');
        }
    }


    async getObject(KEY) {
        try {
            const data = await s3
                .getObject({
                    Bucket: bucketName,
                    Key: KEY,
                })
                .promise();

            return data;
        } catch {
            console.log('Error came');
            throw new Error('Error in fetching object');
        }
    }

    async deleteObject() {
        try {
            await s3
                .deleteObject({
                    Bucket: bucketName,
                    Key: KEY,
                })
                .promise();

            console.log(`Object '${key}' deleted successfully.`);
        } catch {
            throw new Error('Error in deleting the object');
        }
    }
}

module.exports = AWSS3Wrapper;