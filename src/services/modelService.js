const ModelDevice = require("../models/modelDevice");
const RentalInfoModel = require("../models/rentalInfo");
const RentalScheduleModel = require("../models/rentalSchedule");

const modelService = {
    getAll: async (query) => {
        try {
            const { status } = query
            const devices = await ModelDevice.find().sort({ name: 1 });
            return devices
        } catch (error) {
            throw new Error('Failed to fetch devices')
        }
    },
    create: async (data) => {
        try {
            const result = new ModelDevice(data)
            const savedDevice = await result.save()

            return savedDevice
        } catch (error) {
            throw new Error(error.message)
        }
    },
    update: async (params, data) => {
        try {
            const updatedDevice = await ModelDevice.findByIdAndUpdate(params.id, data, { returnDocument: 'after' })
            const updateRentalInfo = await RentalInfoModel.findOneAndUpdate({ deviceId: params.id }, { price: data.price, status: data.status }, { returnDocument: 'after' })
            return { updatedDevice, updateRentalInfo }
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

module.exports = modelService