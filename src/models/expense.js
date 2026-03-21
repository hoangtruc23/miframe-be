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
    note: {
        type: String,
        required: false,
    },
    status: {
        type: String,
        required: true,
    },
})

const ExpensesModel = model('expenses', expenseSchema)

module.exports = ExpensesModel
