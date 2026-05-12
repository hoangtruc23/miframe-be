const mongoose = require('mongoose');
const { Schema } = mongoose;

const SellImportReceiptSchema = new Schema({
    supplierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Suppliers',
        required: false
    },
    total: { //Tổng tiền nhập đơn này
        type: Number,
        required: false
    },
    date: {
        type: Date(),
        required: false
    },
    note: {
        type: String
    },
});

const SellImportReceiptModel = mongoose.model('sellImportReceipt', SellImportReceiptSchema);

module.exports = SellImportReceiptModel;