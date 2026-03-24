const ExpenseModel = require("../models/expense");

const expenseService = {
    getAll: async (query) => {
        try {
            const { status } = query
            let queryCondition = {};
            // if (status && status !== '') {
            //     queryCondition.status = status;
            // }
            const rentals = await ExpenseModel.find(queryCondition).sort({ description: 1 })
            return rentals
        } catch (error) {
            throw error
        }
    },
    create: async (data) => {
        try {
            const result = new ExpenseModel(data)
            const savedDevice = await result.save()

            return savedDevice
        } catch (error) {
            throw error
        }
    },
    update: async (params, data) => {
        try {
            const { id } = params
            const result = await ExpenseModel.findByIdAndUpdate(id, data)
            return result
        } catch (error) {
            throw error
        }
    },
}

module.exports = expenseService