const SellProductItemModel = require("../../models/sell_ProductItems");

const productItemsService = {
    getAll: async (query) => {
        try {
            const { status } = query;

            const filter = {};
            if (status) {
                filter.status = status; // Ví dụ: 'IN_STOCK', 'SOLD'
            }

            const result = await SellProductItemModel.find(filter)
                .populate('categoriesId')
                .sort({ dateImport: -1 }); // Sắp xếp máy mới nhập lên đầu

            return result;
        } catch (error) {
            throw new Error(error.message);
        }
    },
    update: async (params, data) => {
        try {
            const { id } = params
            const updated = await SellProductItemModel.findByIdAndUpdate(id, data, { returnDocument: 'after' })
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

module.exports = productItemsService