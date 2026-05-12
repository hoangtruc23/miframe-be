const mongoose = require('mongoose');
const { Schema } = mongoose;

const SupplierSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    sdt: {
        type: String,
        required: false
    },
    note: {
        type: String
    },
});

const SupplierModel = mongoose.model('suppliers', SupplierSchema);

module.exports = SupplierModel;