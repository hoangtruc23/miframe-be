const { Schema, model, Types } = require('mongoose')

const SellDeviceSchema = new Schema({
    detailId: {
        type: Types.ObjectId,
        ref: 'sellImportDetail',
        required: true,
    },
    serial: {
        type: Number,
        required: true,
    },
    note: {
        type: String,
        required: false,
    },
    status: {
        type: String,
        required: true,
        enum: ['available', 'sold'],
    },
})

const SellDeviceModel = model('sellDevice', SellDeviceSchema)

module.exports = SellDeviceModel