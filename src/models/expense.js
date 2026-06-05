const { Schema, model, Types } = require('mongoose')

const expenseSchema = new Schema({
    description: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    datePaid: {
        type: Date,
        required: false,
    },
    payer: {
        type: String,
        required: false,
    },
    transactionType: {
        type: String,
        required: true,
        enum: ['income', 'expense'], // income = Thu vào, expense = Chi ra
    },
    category: { //Loại chi phí
        type: String,
        required: true,
        enum: [
            'revenue',      // Thu nhập (Doanh thu bán hàng, dịch vụ...)
            'salary',        // Chi phí nhân sự (lương nhân viên, công tự làm)
            'marketing',     // Chi phí quảng cáo (Facebook/TikTok Ads, SEO website)
            'maintenance',   // Chi phí bảo dưỡng và khấu hao thiết bị
            'replacement',   // Chi phí mua mới phụ kiện hao mòn (thẻ nhớ, pin chai, cáp sạc)
            'capex',         // Mua máy mới
            'other'          // Chi phí phát sinh khác
        ],
    },
    note: {
        type: String,
        required: false,
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'paid']
    },
})

const ExpenseModel = model('expenses', expenseSchema)

module.exports = ExpenseModel
