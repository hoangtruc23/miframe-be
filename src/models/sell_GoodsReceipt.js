const mongoose = require('mongoose');
const { Schema } = mongoose;

const SellGoodsReceiptSchema = new Schema({
    supplierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'suppliers',
        required: false
    },
    receiptDetails: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'sellReceiptDetail'
    }],
    total: { //Tổng tiền nhập đơn này
        type: Number,
        required: false
    },
    date: {
        type: Date,
        required: false
    },
    note: {
        type: String,
        required: false
    },
});

const SellGoodsReceiptModel = mongoose.model('sellGoodsReceipt', SellGoodsReceiptSchema);

module.exports = SellGoodsReceiptModel;