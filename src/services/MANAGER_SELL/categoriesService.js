const SellCategoriesModel = require("../../models/sell_Categories");

const categoriesService = {
    getAll: async () => {
        try {
            const result = await SellCategoriesModel.find().sort({ name: 1 });
            return result
        } catch (error) {
            throw new Error(error.message)
        }
    },
    create: async (data) => {
        try {
            const result = new SellCategoriesModel(data)
            const saved = await result.save()
            return saved
        } catch (error) {
            throw new Error(error.message)
        }
    },
    update: async (params, data) => {
        try {
            const updated = await SellCategoriesModel.findByIdAndUpdate(params.id, data, { returnDocument: 'after' })
            return updated
        } catch (error) {
            throw new Error(error.message)
        }
    },
    delete: async (params) => {
        try {
            const updatedDevice = await SellCategoriesModel.findByIdAndDelete(params.id)
            return updatedDevice
        } catch (error) {
            throw new Error(error.message)
        }
    }
}

module.exports = categoriesService