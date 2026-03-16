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
    note: { //Ghi chú khách hàng
        type: String,
        required: false,
    },
})

const CustomerModel = model('customers', customerSchema)

module.exports = CustomerModel
