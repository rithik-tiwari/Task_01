const Joi = require('joi');
const mongoose = require('mongoose');
const File = require('../datamongo/data')
// Define the Joi schema matching your Mongoose schema
const fileSchema = Joi.object({
  PONumber: Joi.number().integer().required(),
  ContainerNo: Joi.number().integer().required(),
  HSCode: Joi.string().required(),
  MaterialCode: Joi.string().required(),
  MaterialName: Joi.string().required(),
  Quantity: Joi.number().positive().required(),
  QuantityUnit: Joi.number().required(),
  NetWeight: Joi.number().positive().required(),
  GrossWeight: Joi.number().positive().required(),
  WeightUnit: Joi.number().required(), // Assuming units might be string
  Volume: Joi.number().positive().required(),
  VolumeUnit: Joi.number().required(), // Assuming units might be string
  InvoiceNumber: Joi.number().integer().required(),
  PalletNo: Joi.number().integer().required(),
});
module.exports=fileSchema;