const SupplierModel = require("../../models/sell_supplier");

const supplierService = {
    getAll: async () => {
        try {
            const result = await SupplierModel.find().sort({ name: 1 });
            return result
        } catch (error) {
            throw new Error(error.message)
        }
    },
    create: async (data) => {
        try {
            const result = new SupplierModel(data)
            const saved = await result.save()

            return saved
        } catch (error) {
            throw new Error(error.message)
        }
    },
    update: async (params, data) => {
        try {
            const updated = await SupplierModel.findByIdAndUpdate(params.id, data, { returnDocument: 'after' })
            return updated
        } catch (error) {
            throw new Error(error.message)
        }
    },
    delete: async (params) => {
        try {
            const updatedDevice = await ModelDevice.findByIdAndDelete(params.id)
            return updatedDevice
        } catch (error) {
            throw new Error(error.message)
        }
    }
}

module.exports = supplierService