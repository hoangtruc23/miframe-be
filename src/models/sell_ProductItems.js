const { Schema, model, Types } = require('mongoose')

const SellProductItemsSchema = new Schema({
    categoriesId: {
        type: Types.ObjectId,
        ref: 'sellCategories',
        required: true
    },
    series: {
        type: String,
        // unique: true,  // Mỗi máy 1 số series duy nhất
        required: true
    },
    priceImport: { // Giữ lại giá nhập của riêng máy này
        type: Number,
        required: true
    },
    goodsReceiptId: { // Nhập từ phiếu nào
        type: Types.ObjectId,
        ref: 'sellGoodsReceipt'
    },
    status: {
        type: String,
        enum: ['IN_STOCK', 'SOLD', 'WARRANTY'],
        default: 'IN_STOCK'
    }, // Trạng thái: Trong kho, Đã bán, Đang bảo hành
    dateImport: { type: Date, default: Date.now }
})

const SellProductItemModel = model('sellProductItems', SellProductItemsSchema)

module.exports = SellProductItemModel