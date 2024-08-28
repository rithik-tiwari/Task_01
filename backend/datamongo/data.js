const mongoose = require('mongoose');
const { Schema } = mongoose;
const fileSchema = new Schema({
  PONumber: { type: Number, required: true },
  ContainerNo: { type: Number, required: true },
  HSCode: { type: String, required: true },
  MaterialCode: { type: String, required: true },
  MaterialName :{type : String ,required :true},
  Quantity:{type : Number ,required :true},
  QuantityUnit:{type : Number ,required :true},
  NetWeight :{type : Number ,required :true},
  GrossWeight:{type : Number ,required :true},
  WeightUnit:{type : Number ,required :true},
  Volume:{type : Number ,required :true},
  VolumeUnit:{type : Number ,required :true},
  InvoiceNumber:{type : Number ,required :true},
  PalletNo:{type : Number ,required :true},
  uploadedAt: { type: Date, default: Date.now }
});
const File = mongoose.model('File', fileSchema);
module.exports = File;









