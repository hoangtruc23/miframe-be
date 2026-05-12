const { Schema, model, Types } = require('mongoose')

const SellImportDetailSchema = new Schema({
    modelId: { //Loại máy
        type: Types.ObjectId,
        ref: 'modelDevices',
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

const SellImportDetailModel = model('sellImportDetail', SellImportDetailSchema)

module.exports = SellImportDetailModel
