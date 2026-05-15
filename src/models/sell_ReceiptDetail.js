const { Schema, model, Types } = require('mongoose')

const SellReceiptDetailSchema = new Schema({
    categoriesId: { //Loại máy
        type: Types.ObjectId,
        ref: 'sellCategories',
        required: true,
    },
    quality: {
        type: Number,
        required: true,
    },
    priceImport: { //Giá nhập
        type: Number,
        required: true,
    },
    note: {
        type: String,
        required: false,
    },
})

const SellReceiptDetailModel = model('sellReceiptDetail', SellReceiptDetailSchema)

module.exports = SellReceiptDetailModel
