const mongoose = require('mongoose');
const { Schema } = mongoose;

const SellCustomerSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: false
    },
    note: {
        type: String
    },
});

const SellCustomerModel = mongoose.model('sellCustomers', SellCustomerSchema);

module.exports = SellCustomerModel;