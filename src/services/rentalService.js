const CustomerModel = require('../models/customer')
const DeviceModel = require('../models/device')
const RentalScheduleModel = require('../models/rentalSchedule')
const constant = require('../utils/constant/constant')

const rentalService = {
    dashboard: async () => {
        try {
            const stats = await RentalScheduleModel.aggregate([
                {
                    $group: {
                        _id: null,
                        // 1. Tính tổng tất cả các cột total (không phân biệt trạng thái)
                        allTotal: { $sum: "$total" },
                        // 2. Chỉ tính tổng những đơn có status là 'completed'
                        completedTotal: {
                            $sum: {
                                $cond: [{ $eq: ["$status", "completed"] }, "$total", 0]
                            }
                        },
                        count: { $sum: 1 }
                    }
                }
            ]);
            if (stats.length > 0) {
                return stats[0];
            }

            return { allTotal: 0, completedTotal: 0, count: 0 };
        } catch (error) {
            throw error;
        }
    },
    getAll: async (query) => {
        try {
            const { status } = query
            let queryCondition = {};
            if (status && status !== '') {
                queryCondition.status = status;
            }
            const rentals = await RentalScheduleModel.find(queryCondition).populate('deviceIds').populate('customerId').sort({ startRental: 1 })
            return rentals
        } catch (error) {
            throw error
        }
    },
    getRentalToday: async () => {
        try {
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date();
            endOfDay.setHours(23, 59, 59, 999);

            const queryCondition = {
                $or: [
                    {
                        startRental: {
                            $gte: startOfDay,
                            $lte: endOfDay
                        }
                    },
                    {
                        endRental: {
                            $gte: startOfDay,
                            $lte: endOfDay
                        }
                    }
                ],
                status: { $ne: 'completed' }
            };
            const rentals = await RentalScheduleModel.find(queryCondition)
                .populate('deviceIds',)
                .populate('customerId', 'name email')
                .sort({ startRental: 1 })
                .lean();

            return rentals;
        } catch (error) {
            console.error("Lỗi khi lấy lịch hôm nay:", error);
            throw error;
        }
    },
    create: async (rentalData) => {
        try {
            let customer = null;
            if (rentalData.nameCustomer || rentalData.phoneCustomer) {
                customer = await CustomerModel.findOne({
                    name: rentalData.nameCustomer
                });
                if (!customer) {
                    customer = await CustomerModel.create({
                        name: rentalData.nameCustomer,
                        note: rentalData.noteCustomer
                    });
                }
            }

            const newRental = await RentalScheduleModel.create({
                ...rentalData,
                customerId: customer?._id || null,
            });

            //Update status Device
            let deviceStatus;
            if (rentalData.status === constant.STATUS_RENTAL.rented.value) {
                deviceStatus = constant.STATUS_DEVICE.rented.value;
            } else if ([constant.STATUS_RENTAL.completed.value, constant.STATUS_RENTAL.canceled.value].includes(rentalData.status)) {
                deviceStatus = constant.STATUS_DEVICE.available.value;
            }

            // Cập nhật cho TẤT CẢ thiết bị trong danh sách deviceIds
            if (deviceStatus && rentalData.deviceIds) {
                const res = await DeviceModel.updateMany(
                    { _id: { $in: rentalData.deviceIds } }, // Tìm tất cả máy có ID nằm trong mảng này
                    { $set: { status: deviceStatus } }      // Cập nhật trạng thái mới
                );
            }

            return newRental;
        } catch (error) {
            throw error
        }
    },
    update: async (params, rentalData) => {
        try {
            const updatedRental = await RentalScheduleModel.findByIdAndUpdate(params.id, rentalData, { returnDocument: 'after' })

            if (rentalData.nameCustomer || rentalData.phoneCustomer) {
                await CustomerModel.findOneAndUpdate(
                    { name: rentalData.nameCustomer },
                    {
                        phone: rentalData.phoneCustomer,
                        note: rentalData.noteCustomer
                    },
                    { upsert: true, returnDocument: 'after' } // Nếu không có thì tạo mới (upsert)
                );
            }

            //Update status Device
            let deviceStatus;
            if (rentalData.status === constant.STATUS_RENTAL.rented.value) {
                deviceStatus = constant.STATUS_DEVICE.rented.value;
            } else if ([constant.STATUS_RENTAL.completed.value, constant.STATUS_RENTAL.canceled.value].includes(rentalData.status)) {
                deviceStatus = constant.STATUS_DEVICE.available.value;
            }

            // Cập nhật cho TẤT CẢ thiết bị trong danh sách deviceIds
            if (deviceStatus && rentalData.deviceIds) {
                const res = await DeviceModel.updateMany(
                    { _id: { $in: rentalData.deviceIds } }, // Tìm tất cả máy có ID nằm trong mảng này
                    { $set: { status: deviceStatus } }      // Cập nhật trạng thái mới
                );
            }

            return updatedRental;
        } catch (error) {
            throw error
        }
    },
    delete: async (params) => {
        try {
            const { id } = params
            const result = await RentalScheduleModel.findByIdAndDelete(id)
            return result;
        } catch (error) {
            throw error
        }
    }
}

module.exports = rentalService