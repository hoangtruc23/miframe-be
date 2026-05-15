const { Schema, model, Types } = require('mongoose');

const SellOrderSchema = new Schema({
    orderCode: {
        type: String,
        unique: true,
        required: true
    },
    customerId: {
        type: Types.ObjectId,
        ref: 'sellCustomers',
        required: false
    },
    // Danh sách các item cụ thể đã bán
    orderItems: [{
        productItemId: {
            type: Types.ObjectId,
            ref: 'sellProductItems', // Tham chiếu đến máy cụ thể (có số series)
            required: true
        },
        priceExport: { // Giá bán thực tế tại thời điểm đó
            type: Number,
            required: true
        },
        priceImportAtSale: { // Lưu lại giá nhập tại thời điểm bán để tính lời lỗ nhanh
            type: Number,
            required: true
        }
    }],

    totalAmount: { // Tổng giá trị đơn hàng
        type: Number,
        required: true
    },
    totalProfit: { // Lợi nhuận của đơn hàng (Tổng priceExport - Tổng priceImportAtSale)
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['CASH', 'TRANSFER', 'COD'],
        default: 'CASH'
    },
    status: {
        type: String,
        enum: ['PAID', 'PENDING', 'CANCELLED'],
        default: 'PAID'
    },
    dateSales: { type: Date, default: Date.now },
    note: { type: String }
});

const SellOrderModel = model('sellOrders', SellOrderSchema);
module.exports = SellOrderModel;