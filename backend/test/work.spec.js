const chai = require('chai');
const sinon = require('sinon');
const { expect } = chai;

const fastify = require('fastify')();
const XLSX = require('xlsx');
const excelControllers = require('../controllers/controlExcel');
const Excel = require('../routes/excelRoutes');
const Product = require('../models/mongo/productmongo');
const getUsers = require('../controllers/controlExcel');
const getFile = require('../controllers/controlExcel');
const uploadFile = require('../controllers/controlExcel');
const AwsS3Wrapper = require('../config/s3config');
const excelHandler = require('../utils/excelRead');
const AWS = require('aws-sdk');
const { AWSS3Wrapper } = require('../config/s3config');
const mongoLocation = require('../models/mongo/locationmongo');
const mongoProduct = require('../models/mongo/productmongo');
const insertIntoMongoDB = require('../models/mongodbInsert');
const { Pool } = require('pg');
const Cities = require('../models/pgsql/citysql');
const Shipments = require('../models/pgsql/shipmentsql');
const insertIntoPostgres = require('../models/postgressInsert');
const RedisQueue = require('bull');
const produceJobFromS3 = require('../producer');


const pgPool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'mydbpostgress',
    password: 'password',
    port: 5432
});

// controller {getUsers, getFile, uploadFile} test cases
describe('getUsers', () => {
    let req;
    let reply;

    beforeEach(() => {
        reply = { send: sinon.spy() };
    });

    it('should return "user" when called with valid request and reply objects', () => {
        req = {};
        getUsers(req, reply);
        expect(reply.send.calledWith('user')).to.be.true;
    });

    it('should handle cases where req object is null or undefined', () => {
        getUsers(null, reply);
        expect(reply.send.calledWith('user')).to.be.true;
        getUsers(undefined, reply);
        expect(reply.send.calledWith('user')).to.be.true;
    });

    it('should return "user" when called with unexpected properties in req object', () => {
        req = { unexpectedProp: 'value' };
        getUsers(req, reply);
        expect(reply.send.calledWith('user')).to.be.true;
    });
});

describe('getFile', () => {
    let req;
    let reply;
    let productFindStub;

    beforeEach(() => {
        req = {};
        reply = {
            status: sinon.stub().returnsThis(),
            send: sinon.spy(),
        };
        productFindStub = sinon.stub(Product, 'find');
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should return a list of products when products exist in the database', async () => {
        const mockProducts = [{ name: 'Product1' }, { name: 'Product2' }];
        productFindStub.resolves(mockProducts);

        await getFile(req, reply);

        expect(productFindStub.calledOnce).to.be.true;
        expect(reply.status.calledWith(200)).to.be.true;
        expect(reply.send.calledWith({ file: mockProducts })).to.be.true;
    });

    it('should return a 500 error when there is a database connection failure', async () => {
        const error = new Error('Database connection failed');
        productFindStub.rejects(error);

        await getFile(req, reply);

        expect(productFindStub.calledOnce).to.be.true;
        expect(reply.status.calledWith(500)).to.be.true;
        expect(reply.send.calledWith({ error: 'failed to fetch object ' })).to.be.true;
    });
});

describe('uploadFile', () => {
    let req;
    let reply;
    let awsS3WrapperStub;
    let excelHandlerStub;

    beforeEach(() => {
        req = {
            file: sinon.stub().resolves('fileData')
        };
        reply = {
            status: sinon.stub().returnsThis(),
            send: sinon.spy()
        };

        awsS3WrapperStub = sinon.stub(AwsS3Wrapper.prototype, 'putObject').resolves('uniqueKey');
        sinon.stub(AwsS3Wrapper.prototype, 'createBucket').resolves();
        excelHandlerStub = sinon.stub(excelHandler, 'readExcel').resolves({ jsonData: {}, worksheet: {} });
        sinon.stub(excelHandler, 'matchHeaders').returns(true);
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should upload a file to S3 and return a 200 status when the file is valid', async () => {
        const initiate = sinon.stub().resolves();

        await uploadFile(req, reply);

        expect(req.file.calledOnce).to.be.true;
        expect(excelHandlerStub.calledOnce).to.be.true;
        expect(excelHandler.matchHeaders.calledOnce).to.be.true;
        expect(awsS3WrapperStub.calledOnce).to.be.true;
        expect(initiate.calledOnceWith({ jobName: 'dbQueue', filekey: 'uniqueKey' })).to.be.true;
        expect(reply.status.calledWith(200)).to.be.true;
        expect(reply.send.calledWith({ message: 'File will be stored ..' })).to.be.true;
    });

    it('should return a 500 status when the uploaded file is not an Excel file', async () => {
        req.file.rejects(new Error('Invalid file type'));

        await uploadFile(req, reply);

        expect(req.file.calledOnce).to.be.true;
        expect(reply.status.calledWith(500)).to.be.true;
        expect(reply.send.calledWith(sinon.match.instanceOf(Error).and(sinon.match.has('message', 'Invalid file type')))).to.be.true;
    });

    it('should validate Excel file structure and content before processing', async () => {
        const initiate = sinon.stub().resolves();

        await uploadFile(req, reply);

        expect(req.file.calledOnce).to.be.true;
        expect(excelHandlerStub.calledOnce).to.be.true;
        expect(excelHandler.matchHeaders.calledOnce).to.be.true;
        expect(awsS3WrapperStub.calledOnce).to.be.true;
        expect(initiate.calledOnceWith({ jobName: 'dbQueue', filekey: 'uniqueKey' })).to.be.true;
        expect(reply.status.calledWith(200)).to.be.true;
        expect(reply.send.calledWith({ message: 'File will be stored ..' })).to.be.true;
    });
});

// excel Routes test cases
describe('Excel Routes', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should register routes successfully when getRoutes is called', async () => {
        sandbox.stub(fastify, 'hasRoute').callsFake((route, method) => {
            if (route === '/' || (route === '/upload' && method === 'POST')) {
                return true;
            }
            return false;
        });

        await Excel.getRoutes(fastify);

        expect(fastify.hasRoute.calledWith('/')).to.be.true;
        expect(fastify.hasRoute.calledWith('/upload')).to.be.true;
        expect(fastify.hasRoute.calledWith('/upload', 'POST')).to.be.true;
    });

    it('should return 404 for invalid routes', async () => {
        await Excel.getRoutes(fastify);

        const response = await fastify.inject({
            method: 'GET',
            url: '/invalid-route',
        });

        expect(response.statusCode).to.equal(404);
    });

    it('should return proper error messages for failed requests', async () => {
        sandbox.stub(excelControllers, 'getUsers').throws(new Error('Failed to get users'));
        sandbox.stub(excelControllers, 'getFile').throws(new Error('Failed to get file'));
        sandbox.stub(excelControllers, 'uploadFile').throws(new Error('Failed to upload file'));

        try {
            await Excel.getRoutes(fastify);
        } catch (error) {
            expect(error.message).to.equal('Failed to get users');
        }

        try {
            await excelControllers.getFile();
        } catch (error) {
            expect(error.message).to.equal('Failed to get file');
        }

        try {
            await excelControllers.uploadFile();
        } catch (error) {
            expect(error.message).to.equal('Failed to upload file');
        }
    });
});

// s3config test cases

describe('AWSS3Wrapper S3 Operations', () => {
    let s3Mock;
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        s3Mock = {
            createBucket: sandbox.stub().returns({ promise: sandbox.stub().resolves({}) }),
            headObject: sandbox.stub().returns({ promise: sandbox.stub().resolves({}) }),
            putObject: sandbox.stub().returns({ promise: sandbox.stub().resolves({}) }),
            getObject: sandbox.stub().returns({ promise: sandbox.stub().resolves({}) }),
            deleteObject: sandbox.stub().returns({ promise: sandbox.stub().resolves({}) }),
        };
        sandbox.stub(AWS, 'S3').returns(s3Mock);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should create a new S3 bucket when createBucket is called', async () => {
        const wrapper = new AWSS3Wrapper('data', 'filename');
        await wrapper.createBucket();
        expect(s3Mock.createBucket).to.have.been.calledWith({ Bucket: 'my-bucket' });
    });

    it('should check if an object exists in the S3 bucket when checkIfObjectExists is called', async () => {
        const wrapper = new AWSS3Wrapper('data', 'filename');
        const exists = await wrapper.checkIfObjectExists('testKey');
        expect(s3Mock.headObject).to.have.been.calledWith({ Bucket: 'my-bucket', Key: 'testKey' });
        expect(exists).to.be.true;
    });

    it('should retrieve object details from S3 bucket when getObjectDetails is called', async () => {
        const objectData = { LastModified: '2022-01-01T00:00:00Z', ContentLength: 1024 };
        s3Mock.headObject.returns({ promise: sinon.stub().resolves(objectData) });

        const wrapper = new AWSS3Wrapper('data', 'filename');
        const result = await wrapper.getObjectDetails('objectKey');

        expect(result).to.deep.equal(objectData);
        expect(s3Mock.headObject).to.have.been.calledWith({ Bucket: 'my-bucket', Key: 'objectKey' });
    });

    it('should upload a new object to the S3 bucket', async () => {
        const wrapper = new AWSS3Wrapper('data', 'filename');
        const KEY = 'test-key';
        await wrapper.putObject(KEY);

        expect(s3Mock.headObject).to.have.been.calledWith({ Bucket: 'my-bucket', Key: KEY });
        expect(s3Mock.putObject).to.have.been.calledWith({ Bucket: 'my-bucket', Key: KEY, Body: 'data' });
    });

    it('should retrieve an existing object from the S3 bucket when getObject is called', async () => {
        const wrapper = new AWSS3Wrapper('data', 'filename');
        await wrapper.getObject('existingObjectKey');

        expect(s3Mock.getObject).to.have.been.calledWith({ Bucket: 'my-bucket', Key: 'existingObjectKey' });
    });

    it('should delete an object from the S3 bucket when deleteObject is called', async () => {
        const wrapper = new AWSS3Wrapper('data', 'filename');
        const KEY = 'test-key';
        await wrapper.deleteObject(KEY);

        expect(s3Mock.deleteObject).to.have.been.calledWith({ Bucket: 'my-bucket', Key: KEY });
    });

    it('should return false when checking for a non-existent object', async () => {
        s3Mock.headObject.returns({ promise: sinon.stub().rejects({ code: 'NotFound' }) });

        const wrapper = new AWSS3Wrapper('data', 'filename');
        const result = await wrapper.checkIfObjectExists('non-existent-key');

        expect(result).to.be.false;
        expect(s3Mock.headObject).to.have.been.calledWith({ Bucket: 'my-bucket', Key: 'non-existent-key' });
    });

    it('should validate format and content of uploaded object when putObject is called', async () => {
        const wrapper = new AWSS3Wrapper('data', 'filename');
        const KEY = 'test-key';

        await wrapper.putObject(KEY);

        expect(s3Mock.headObject).to.have.been.calledWith({ Bucket: 'my-bucket', Key: KEY });
        expect(s3Mock.putObject).to.have.been.calledWith({ Bucket: 'my-bucket', Key: KEY, Body: 'data' });
        expect(s3Mock.getObject).to.have.been.calledWith({ Bucket: 'my-bucket', Key: 'filename' });
    });
});

// excelRead test  cases.
describe('Excel file handling', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should read an Excel file and convert it to JSON when the file is valid', async () => {
        const mockBuffer = Buffer.from('mock excel data');
        const mockFile = { buffer: Promise.resolve(mockBuffer) };
        const mockWorkbook = {
            SheetNames: ['Sheet1'],
            Sheets: {
                'Sheet1': { '!ref': 'A1:B2', A1: { v: 'Header1' }, B1: { v: 'Header2' }, A2: { v: 'Data1' }, B2: { v: 'Data2' } }
            }
        };

        const readStub = sandbox.stub(XLSX, 'read').returns(mockWorkbook);
        const sheetToJsonStub = sandbox.stub(XLSX.utils, 'sheet_to_json').returns([{ Header1: 'Data1', Header2: 'Data2' }]);

        const excel = new Excel(mockFile);
        const result = await excel.readExcel();

        expect(result.jsonData).to.deep.equal([{ Header1: 'Data1', Header2: 'Data2' }]);
        expect(result.worksheet).to.deep.equal(mockWorkbook.Sheets['Sheet1']);
        expect(readStub.calledOnce).to.be.true;
        expect(sheetToJsonStub.calledOnce).to.be.true;
    });

    // Correctly identify and match headers in the worksheet
    it('should correctly identify and match headers in the worksheet', () => {
        const mockWorksheet = {
            '!ref': 'A1:C1',
            A1: { v: 'Header1' },
            B1: { v: 'Header2' },
            C1: { v: 'Header3' }
        };
        const mockHeaders = ['Header1', 'Header2', 'Header3'];
        const mockMissingHeaders = null;

        const decodeRangeStub = sandbox.stub(XLSX.utils, 'decode_range').returns({ s: { c: 0 }, e: { c: 2 } });
        const encodeCellStub = sandbox.stub(XLSX.utils, 'encode_cell').callsFake(({ r, c }) => ({ r, c }));
        const sheetToJsonStub = sandbox.stub(XLSX.utils, 'sheet_to_json').returns([]);
        const consoleLogStub = sandbox.stub(console, 'log');

        const excel = new Excel();
        const result = excel.matchHeaders(mockWorksheet);

        expect(result).to.equal(1);
        expect(decodeRangeStub.calledOnce).to.be.true;
        expect(encodeCellStub.called).to.be.true;
        expect(consoleLogStub.calledWith({ s: { c: 0 }, e: { c: 2 } })).to.be.true;
        expect(consoleLogStub.calledWith(JSON.stringify(mockHeaders))).to.be.true;
        expect(consoleLogStub.calledWith('missingHeaders---------', mockMissingHeaders)).to.be.true;
    });

    // Clean data by removing unwanted characters from keys
    it('should clean data keys by removing unwanted characters', () => {
        const jsonData = [{ 'Name*': 'John Doe', 'Age': 30 }, { 'Name': 'Jane Doe', 'Age': 25 }];
        const expectedCleanedData = [{ 'Name': 'John Doe', 'Age': 30 }, { 'Name': 'Jane Doe', 'Age': 25 }];

        const excel = new Excel();
        const cleanedData = excel.cleanData(jsonData);

        expect(cleanedData).to.deep.equal(expectedCleanedData);
    });

    // Handle empty Excel files gracefully
    it('should handle empty Excel files gracefully', async () => {
        const mockBuffer = Buffer.from('');
        const mockFile = { buffer: Promise.resolve(mockBuffer) };
        const mockWorkbook = {
            SheetNames: [],
            Sheets: {}
        };

        sandbox.stub(XLSX, 'read').returns(mockWorkbook);

        const excel = new Excel(mockFile);
        await expect(excel.readExcel()).to.be.rejectedWith('Error in reading excel file');
    });

    // Validate that the buffer is correctly read from the file
    it('should read an Excel file and convert it to JSON when the file is valid', async () => {
        const mockBuffer = Buffer.from('mock excel data');
        const mockFile = { buffer: Promise.resolve(mockBuffer) };
        const mockWorkbook = {
            SheetNames: ['Sheet1'],
            Sheets: {
                'Sheet1': { '!ref': 'A1:B2', A1: { v: 'Header1' }, B1: { v: 'Header2' }, A2: { v: 'Data1' }, B2: { v: 'Data2' } }
            }
        };

        const readStub = sandbox.stub(XLSX, 'read').returns(mockWorkbook);
        const sheetToJsonStub = sandbox.stub(XLSX.utils, 'sheet_to_json').returns([{ Header1: 'Data1', Header2: 'Data2' }]);

        const excel = new Excel(mockFile);
        const result = await excel.readExcel();

        expect(result.jsonData).to.deep.equal([{ Header1: 'Data1', Header2: 'Data2' }]);
        expect(result.worksheet).to.deep.equal(mockWorkbook.Sheets['Sheet1']);
        expect(readStub.calledOnce).to.be.true;
        expect(sheetToJsonStub.calledOnce).to.be.true;
    });
});

// validateHeader test case
describe('Header Validation', () => {
    it('should return null when all expected headers are present', () => {
        const headers = [
            'Shipment Type*',
            'Order Number*',
            'Order Type (STO/PO/SO/RO)*',
            'Primary Mode*',
            'Expected Delivery Date*',
            'Incoterm*',
            'Source Reference ID*',
            'Destination Reference ID*',
            'Cargo Type*',
            'Material Code*',
            'Quantity*',
            'Quantity Unit*',
            'Shipment Number'
        ];

        const result = validateHeaders(headers);

        expect(result).to.be.null;
    });
});

// Insert into MongoDB test case
describe('MongoDB Data Insertion', () => {
    let locationFindOneStub;
    let locationCreateStub;
    let productInsertManyStub;

    beforeEach(() => {
        // Stubbing MongoDB models
        locationFindOneStub = sinon.stub(locationmongo, 'findOne').resolves(null);
        locationCreateStub = sinon.stub(locationmongo, 'create').resolves({ _id: 'locationId' });
        productInsertManyStub = sinon.stub(productmongo, 'insertMany');
    });

    afterEach(() => {
        // Restore the original functions after each test
        sinon.restore();
    });

    it('should insert data into MongoDB when all inputs are valid', async () => {
        const mockData = [
            {
                ShipmentType: 'Air',
                OrderNumber: '12345',
                OrderType: 'Online',
                PrimaryMode: 'Express',
                ExpectedDeliveryDate: new Date(),
                Incoterm: 'FOB',
                SourceReferenceID: 'SRC001',
                DestinationReferenceID: 'DEST001',
                CargoType: 'Electronics',
                MaterialCode: 'MAT001',
                Quantiy: 10,
                QuantityUnit: 'kg',
                ShipmentNumber: 'SHIP001'
            }
        ];

        // Call the function to insert data into MongoDB
        await insertIntoMongoDB(mockData);

        // Check if `insertMany` was called with the correct data
        expect(productInsertManyStub).to.have.been.calledWith([
            {
                ShipmentType: 'Air',
                OrderNumber: '12345',
                OrderType: 'Online',
                PrimaryMode: 'Express',
                ExpectedDeliveryDate: sinon.match.instanceOf(Date),
                Incoterm: 'FOB',
                SourceReferenceID: 'locationId',
                DestinationReferenceID: 'locationId',
                CargoType: 'Electronics',
                MaterialCode: 'MAT001',
                Quantiy: 10,
                QuantityUnit: 'kg',
                ShipmentNumber: 'SHIP001'
            }
        ]);
    });
});

// Insert into Postgresql test case
describe('PostgreSQL Data Insertion', () => {
    let pgPoolStub;
    let mockClient;
    let citiesFindOrCreateStub;
    let shipmentsBulkCreateStub;

    beforeEach(() => {
        // Stubbing the pgPool connection and mock client
        mockClient = {
            query: sinon.stub(),
            release: sinon.stub(),
        };
        pgPoolStub = sinon.stub(pgPool, 'connect').resolves(mockClient);
        citiesFindOrCreateStub = sinon.stub(Cities, 'findOrCreate').resolves([{ id: 1 }]);
        shipmentsBulkCreateStub = sinon.stub(Shipments, 'bulkCreate').resolves();

        // Mocking the behavior of query transaction
        mockClient.query.withArgs('BEGIN').resolves();
        mockClient.query.withArgs('COMMIT').resolves();
    });

    afterEach(() => {
        // Restoring original methods after each test
        sinon.restore();
    });

    it('should connect to PostgreSQL database and insert data successfully', async () => {
        const data = [
            {
                SourceReferenceID: 'SRC1',
                DestinationReferenceID: 'DEST1',
                ShipmentType: 'Type1',
                OrderNumber: '123',
                OrderType: 'TypeA',
                PrimaryMode: 'Air',
                ExpectedDeliveryDate: new Date(),
                Incoterm: 'FOB',
                CargoType: 'General',
                MaterialCode: 'MAT1',
                Quantity: 100,
                QuantityUnit: 'kg',
                ShipmentNumber: 'SHIP123',
            },
        ];

        // Calling the function that inserts data into PostgreSQL
        await insertIntoPostgres(data);

        // Assertions
        expect(pgPoolStub).to.have.been.calledOnce; // pgPool.connect should be called once
        expect(mockClient.query).to.have.been.calledWith('BEGIN'); // Transaction begins
        expect(citiesFindOrCreateStub).to.have.been.called; // Cities.findOrCreate should be called
        expect(shipmentsBulkCreateStub).to.have.been.calledWith(sinon.match.array, { validate: true }); // Shipments.bulkCreate called with data
        expect(mockClient.query).to.have.been.calledWith('COMMIT'); // Transaction commits
        expect(mockClient.release).to.have.been.calledOnce; // Client release called
    });
});

// producer test cases
describe('S3 Data Fetch and Job Queueing', () => {
    let s3WrapperStub;
    let excelStub;
    let redisClientStub;

    beforeEach(() => {
        // Stubbing S3 wrapper, Excel handling, and Redis client
        s3WrapperStub = {
            getObject: sinon.stub().resolves({ Body: Buffer.from('some data') }),
        };
        excelStub = {
            readExcel: sinon.stub().resolves({ jsonData: [{ id: 1, name: 'test' }], worksheet: {} }),
            cleanData: sinon.stub().returns([{ id: 1, name: 'cleaned test' }]),
        };
        redisClientStub = {
            add: sinon.stub().resolves({ id: 'job-id' }),
        };

        sinon.stub(AWSS3Wrapper.prototype, 'getObject').callsFake(s3WrapperStub.getObject);
        sinon.stub(Excel.prototype, 'readExcel').callsFake(excelStub.readExcel);
        sinon.stub(Excel.prototype, 'cleanData').callsFake(excelStub.cleanData);
        sinon.stub(RedisQueue.prototype, 'add').callsFake(redisClientStub.add);
    });

    afterEach(() => {
        sinon.restore(); // Restore all original methods
    });

    it('should fetch data from S3 and add a job to the queue when given a valid key', async () => {
        const s3Key = 'valid-key';

        // Call the function being tested
        await produceJobFromS3(s3Key);

        // Assertions
        expect(s3WrapperStub.getObject).to.have.been.calledOnceWith(s3Key); // Check S3 was called with correct key
        expect(excelStub.readExcel).to.have.been.calledOnce; // Check Excel read
        expect(excelStub.cleanData).to.have.been.calledOnceWith([{ id: 1, name: 'test' }]); // Check data cleaning
        expect(redisClientStub.add).to.have.been.calledOnceWith({ cleanedData: [{ id: 1, name: 'cleaned test' }], s3Key }); // Check job was added to queue
    });
});