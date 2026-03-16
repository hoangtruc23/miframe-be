const { Schema, model, Types } = require('mongoose')

const deviceSchema = new Schema({
    name: { //Tên máy
        type: String,
        required: false,
    },
    model: { //Loại máy
        type: String,
        required: true,
    },
    code: { //Số seriel máy
        type: String,
        required: true,
    },
    priceBuy: { //Giá mua
        type: Number,
        required: true,
    },
    priceRental: { //Giá thuê
        type: Number,
        required: true,
    },
    priceSell: { //Giá bán
        type: Number,
        required: false,
    },
    note: {
        type: String,
        required: false,
    },
    status: {
        type: String,
        required: true,
        default: 'available', //available, rented, maintenance, sold
    },
})

const DeviceModel = model('devices', deviceSchema)

module.exports = DeviceModel
