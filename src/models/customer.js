const { Schema, model, Types } = require('mongoose')

const customerSchema = new Schema({
    name: { //Tên khách hàng
        type: String,
        required: true,
    },
    phone: { //Số điện thoại khách hàng
        type: String,
        required: false,
    },
    cccd: {
        type: String,
        required: false,
    },
    address: { //Địa chỉ khách hàng
        type: String,
        required: false,
    },
    times: {
        type: Number,
        default: 1
    },
    note: { //Ghi chú khách hàng
        type: String,
        required: false,
    },
})

const CustomerModel = model('customers', customerSchema)

module.exports = CustomerModel
