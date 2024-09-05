const Joi = require('joi');
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
  weight_unit: Joi.number().required(), 
  volume: Joi.number().positive().required(),
  volume_unit: Joi.number().required(), 
  invoice_number: Joi.number().integer().required(),
  pallet_no: Joi.number().integer().required(),
});
module.exports=fileSchema;