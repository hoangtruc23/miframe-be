const DeviceModel = require("../models/device")
const RentalInfoModel = require("../models/rentalInfo");
const RentalScheduleModel = require("../models/rentalSchedule");

const deviceService = {
    getAll: async (query) => {
        try {
            const { status } = query
            // const devices = await DeviceModel.find({ status: status || { $in: ['available', 'rented', 'maintenance'] } }).sort({ name: 1 });
            const devices = await DeviceModel.find({ status: status || { $in: ['available', 'rented', 'maintenance', 'sold'] } }).sort({ name: 1 }).populate('modelId');
            return devices
        } catch (error) {
            throw new Error('Failed to fetch devices')
        }
    },
    getAllModelDevice: async () => {
        try {
            const models = await DeviceModel.distinct('model')
            return models
        } catch (error) {
            throw new Error('Failed to fetch device models')
        }
    },
    getAvailableDevices: async (query) => {
        try {
            const { start, end } = query;

            if (!start || !end) {
                return res.status(400).json({ message: "Vui lòng chọn đầy đủ thời gian" });
            }

            const startTime = new Date(start);
            const endTime = new Date(end);

            // Bước 1: Tìm tất cả các đơn thuê có sự giao thoa với khoảng thời gian này
            // Công thức Overlap: (StartA < EndB) AND (EndA > StartB)
            const busyRentals = await RentalScheduleModel.find({
                status: { $ne: 'canceled' }, // Bỏ qua các đơn đã hủy
                $and: [
                    { startRental: { $lt: endTime } },
                    { endRental: { $gt: startTime } }
                ]
            }).select('deviceIds');

            // Bước 2: Lấy danh sách các ID máy bận (trích xuất từ mảng deviceIds của các đơn bận)
            const busyDeviceIds = busyRentals.flatMap(rental => rental.deviceIds);

            // Bước 3: Tìm các thiết bị KHÔNG nằm trong danh sách bận và KHÔNG phải máy đã bán
            const availableDevices = await DeviceModel.find({
                _id: { $nin: busyDeviceIds },
                status: { $nin: ['sold', 'maintenance'] }
            });

            return availableDevices
        } catch (error) {
            throw new Error(error.message)
        }
    },

    create: async (deviceData) => {
        try {
            const result = new DeviceModel(deviceData)
            const savedDevice = await result.save()

            return savedDevice
        } catch (error) {
            throw new Error(error.message)
        }
    },
    update: async (params, deviceData) => {
        try {
            console.log(deviceData)
            const updatedDevice = await DeviceModel.findByIdAndUpdate(params.id, deviceData, { returnDocument: 'after' })
            const updateRentalInfo = await RentalInfoModel.findOneAndUpdate({ deviceId: params.id }, { price: deviceData.price, status: deviceData.status }, { returnDocument: 'after' })
            return { updatedDevice, updateRentalInfo }
        } catch (error) {
            throw new Error(error.message)
        }
    },
    delete: async (params) => {
        try {
            const updatedDevice = await DeviceModel.findByIdAndDelete(params.id)
            return updatedDevice
        } catch (error) {
            throw new Error(error.message)
        }
    }
}

module.exports = deviceService