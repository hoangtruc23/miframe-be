const CustomerModel = require('../models/customer')
const DeviceModel = require('../models/device')
const RentalScheduleModel = require('../models/rentalSchedule')
const constant = require('../utils/constant/constant')

const rentalService = {
    dashboard: async (query) => {
        try {
            const { month, year } = query;
            const targetMonth = parseInt(month);
            const targetYear = parseInt(year);
            const REVENUE_TARGET = 20000000;

            const stats = await RentalScheduleModel.aggregate([
                {
                    $match: {
                        status: { $ne: "cancelled" },
                        startRental: { $exists: true, $ne: null }
                    }
                },
                {
                    $facet: {
                        "monthlyStats": [
                            {
                                $group: {
                                    _id: {
                                        year: { $year: "$startRental" },
                                        month: { $month: "$startRental" }
                                    },
                                    total: { $sum: "$total" },
                                    // Số tiền thực tế thu (đơn đã hoàn thành)
                                    actualCollected: {
                                        $sum: {
                                            $cond: [{ $eq: ["$status", "completed"] }, "$total", 0]
                                        }
                                    }
                                }
                            },
                            // Sắp xếp theo thời gian để dùng cho filter currentMonth/Year
                            { $sort: { "_id.year": -1, "_id.month": -1 } }
                        ],
                    }
                },
                {
                    $project: {
                        currentMonth: {
                            $filter: {
                                input: "$monthlyStats",
                                as: "item",
                                cond: {
                                    $and: [
                                        { $eq: ["$$item._id.month", targetMonth] },
                                        { $eq: ["$$item._id.year", targetYear] }
                                    ]
                                }
                            }
                        },
                        currentYear: {
                            $filter: {
                                input: "$monthlyStats",
                                as: "item",
                                cond: { $eq: ["$$item._id.year", targetYear] }
                            }
                        },
                        // TẠO THÊM TRƯỜNG NÀY: Sắp xếp lại monthlyStats theo total để tìm tháng cao nhất
                        highestMonthStats: {
                            $sortArray: { input: "$monthlyStats", sortBy: { total: -1 } }
                        },
                        monthlyStats: 1
                    }
                },
                {
                    $project: {
                        currentMonth: 1,
                        currentYear: 1,
                        monthlyStats: 1,
                        // Lấy phần tử đầu tiên của mảng đã sort theo total
                        highestMonth: { $arrayElemAt: ["$highestMonthStats", 0] }
                    }
                }
            ]);

            const result = stats[0];

            // Tính toán số liệu
            const monthTotal = result.currentMonth[0]?.total || 0;
            const monthActual = result.currentMonth[0]?.actualCollected || 0;

            const yearTotal = result.currentYear.reduce((acc, curr) => acc + curr.total, 0);
            const yearActual = result.currentYear.reduce((acc, curr) => acc + curr.actualCollected, 0);

            const targetPercent = (monthTotal / REVENUE_TARGET) * 100;

            return {
                monthTotal,
                monthActual,
                yearTotal,
                yearActual,
                highestMonth: result.highestMonth, // Trả về { _id: {year, month}, total, actualCollected }
                targetPercent: targetPercent.toFixed(2),
            };
        } catch (error) {
            console.error("Dashboard Error:", error);
            throw error;
        }
    },
    getAll: async (query) => {
        try {
            const { status } = query
            let queryCondition = {};
            if (status === 'active') {
                queryCondition.status = { $ne: "completed" };
            } else if (status && status !== '') {
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