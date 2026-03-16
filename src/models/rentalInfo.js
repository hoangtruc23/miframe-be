const { Schema, model, Types } = require('mongoose')

const rentalInfoSchema = new Schema({
    deviceId: {
        type: Types.ObjectId,
        ref: 'devices',
        required: true,
    },
    priceRental: {
        type: Number,
        required: true,
    },
    discount: {
        type: Number,
        required: false,
    },
})

const RentalInfoModel = model('rentalInfos', rentalInfoSchema)

module.exports = RentalInfoModel
