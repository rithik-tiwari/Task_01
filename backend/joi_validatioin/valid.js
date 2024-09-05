const Joi = require('joi');
// Define the Joi schema matching your Mongoose schema
const fileSchema = Joi.object({
  id: Joi.number().integer().required(),
  po_number: Joi.number().integer().required(),
  container_no: Joi.number().integer().required(),
  hscode: Joi.string().required(),
  material_code: Joi.string().required(),
  material_name: Joi.string().required(),
  quantity: Joi.number().positive().required(),
  quantity_unit: Joi.number().required(),
  net_weight: Joi.number().positive().required(),
  gross_weight: Joi.number().positive().required(),
  weight_unit: Joi.number().required(), // Assuming units might be string
  volume: Joi.number().positive().required(),
  volume_unit: Joi.number().required(), // Assuming units might be string
  invoice_number: Joi.number().integer().required(),
  pallet_no: Joi.number().integer().required(),
  // createdAt:Joi.date().iso().required(),
  // updatedAt:Joi.date().iso().required(),
});
module.exports=fileSchema;