const { Schema, model, Types } = require('mongoose')

const rentalScheduleSchema = new Schema({
    deviceIds: [{
        type: Types.ObjectId,
        ref: 'devices',
        required: true,
    }],
    startRental: {
        type: Date,
        required: true,
    },
    endRental: {
        type: Date,
        required: true,
    },
    customerId: {
        type: Types.ObjectId,
        ref: 'customers',
        required: false,
    },
    discount: {
        type: Number,
        required: false,
    },
    days: {
        type: Number,
        required: false,
    },
    total: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        required: true,
        enum: ['deposit', 'rented', 'appointment', 'completed', 'canceled'],
    },
})

const RentalScheduleModel = model('rentalSchedules', rentalScheduleSchema)

module.exports = RentalScheduleModel
