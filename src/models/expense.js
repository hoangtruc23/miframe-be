const { Schema, model, Types } = require('mongoose')

const expenseSchema = new Schema({
    description: {
        type: String,
        required: true,
    },
    total: {
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
    note: {
        type: String,
        required: false,
    },
    status: {
        type: String,
        required: true,
    },
})

const ExpenseModel = model('expenses', expenseSchema)

module.exports = ExpenseModel
