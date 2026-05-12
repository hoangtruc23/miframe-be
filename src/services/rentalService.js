const moment = require('moment-timezone');
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


            //TÍNH KPI THEO SỐ DEVICE
            const deviceLength = await DeviceModel.countDocuments({ status: { $ne: 'sold' } });
            const REVENUE_TARGET = (150000 * deviceLength) * 15; // 15 ngày

            const stats = await RentalScheduleModel.aggregate([
                {
                    $match: {
                        status: { $ne: "cancelled" },
                        startRental: { $exists: true, $ne: null },
                        endRental: { $exists: true, $ne: null }
                    }
                },
                {
                    // Bước 1: Tính số ngày và đơn giá mỗi ngày
                    $addFields: {
                        duration: {
                            $max: [
                                1,
                                { $dateDiff: { startDate: "$startRental", endDate: "$endRental", unit: "day" } }
                            ]
                        },
                        // Nếu endRental cùng ngày startRental thì tính là 1 ngày để tránh chia cho 0
                    }
                },
                {
                    $addFields: {
                        dailyRevenue: { $divide: ["$total", "$duration"] }
                    }
                },
                {
                    // Bước 2: Tạo mảng các ngày thuê (mỗi phần tử là index 0, 1, 2...)
                    $addFields: {
                        daysArray: { $range: [0, "$duration"] }
                    }
                },
                { $unwind: "$daysArray" },
                {
                    // Bước 3: Tính toán ngày cụ thể cho từng "mảnh" doanh thu
                    $addFields: {
                        specificDate: {
                            $dateAdd: {
                                startDate: "$startRental",
                                unit: "day",
                                amount: "$daysArray"
                            }
                        }
                    }
                },
                {
                    // Bước 4: Nhóm lại theo tháng/năm của từng ngày đã phân bổ
                    $facet: {
                        "monthlyStats": [
                            {
                                $group: {
                                    _id: {
                                        year: { $year: "$specificDate" },
                                        month: { $month: "$specificDate" }
                                    },
                                    total: { $sum: "$dailyRevenue" },
                                    actualCollected: {
                                        $sum: {
                                            $cond: [{ $eq: ["$status", "completed"] }, "$dailyRevenue", 0]
                                        }
                                    }
                                }
                            },
                            { $sort: { "_id.year": -1, "_id.month": -1 } }
                        ]
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
                        highestMonth: { $arrayElemAt: ["$highestMonthStats", 0] }
                    }
                }
            ]);

            const result = stats[0];

            const monthTotal = result.currentMonth[0]?.total || 0;
            const monthActual = result.currentMonth[0]?.actualCollected || 0;

            const yearTotal = result.currentYear.reduce((acc, curr) => acc + curr.total, 0);
            const yearActual = result.currentYear.reduce((acc, curr) => acc + curr.actualCollected, 0);

            return {
                monthTotal: Math.round(monthTotal),
                monthActual: Math.round(monthActual),
                yearTotal: Math.round(yearTotal),
                yearActual: Math.round(yearActual),
                highestMonth: result.highestMonth,
                targetPercent: ((monthActual / REVENUE_TARGET) * 100).toFixed(2),
                targetTotal: ((monthTotal / REVENUE_TARGET) * 100).toFixed(2),
            };
        } catch (error) {
            console.error("Dashboard Error:", error);
            throw error;
        }
    },
    getAll: async (query) => {
        try {
            const { status, modelDevice, phone } = query
            let queryCondition = {};
            if (status === 'active') {
                queryCondition.status = { $ne: "completed" };
            } else if (status && status !== '') {
                queryCondition.status = status;
            }
            if (modelDevice) {
                // Bước 1: Tìm tất cả thiết bị thuộc modelDevice này
                const matchedDevices = await DeviceModel.find({ modelId: modelDevice }).select('_id');
                const matchedDeviceIds = matchedDevices.map(d => d._id);

                // Bước 2: Chỉ lấy các đơn thuê có chứa ít nhất 1 trong các deviceIds đã tìm được
                queryCondition.deviceIds = { $in: matchedDeviceIds };
            }
            if (phone) {
                const customers = await CustomerModel.find({
                    phone: { $regex: '^' + phone }
                }).select('_id');
                const customerIds = customers.map(c => c._id);
                queryCondition.customerId = { $in: customerIds };
            }

            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            const endOfToday = new Date();
            endOfToday.setHours(23, 59, 59, 999);

            const rentals = await RentalScheduleModel.aggregate([
                { $match: queryCondition },
                {
                    $addFields: {
                        // 1. Xác định các flag (đúng/sai) cho sự kiện hôm nay
                        isStartToday: {
                            $and: [{ $gte: ["$startRental", startOfToday] }, { $lte: ["$startRental", endOfToday] }]
                        },
                        isEndToday: {
                            $and: [{ $gte: ["$endRental", startOfToday] }, { $lte: ["$endRental", endOfToday] }]
                        }
                    }
                },
                {
                    $addFields: {
                        // 2. Nếu là hôm nay (start hoặc end) thì priority = 0
                        priority: {
                            $cond: { if: { $or: ["$isStartToday", "$isEndToday"] }, then: 0, else: 1 }
                        },
                    }
                },
                {
                    $sort: {
                        priority: 1,
                        startRental: 1
                    }
                }
            ]);

            const populatedRentals = await RentalScheduleModel.populate(rentals, [
                { path: 'deviceIds' },
                { path: 'customerId' }
            ]);
            return populatedRentals;
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
                status: { $nin: ['completed'] }
            };
            const rentals = await RentalScheduleModel.find(queryCondition)
                .populate('deviceIds',)
                .populate('customerId', 'name email phone')
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
            if (rentalData.nameCustomer) {
                customer = await CustomerModel.findOneAndUpdate(
                    { name: rentalData.nameCustomer }, // Filter
                    {
                        $inc: { times: 1 },             // Increment "times" by 1
                        $setOnInsert: {                 // Fields set ONLY if creating new
                            note: rentalData.noteCustomer,
                            phone: rentalData.phoneCustomer
                        }
                    },
                    {
                        new: true,
                        upsert: true // Create it if it doesn't exist
                    }
                );
            }

            const formattedData = {
                ...rentalData,
                startRental: moment.tz(rentalData.startRental, "Asia/Ho_Chi_Minh").toDate(),
                endRental: moment.tz(rentalData.endRental, "Asia/Ho_Chi_Minh").toDate(),
            };

            const newRental = await RentalScheduleModel.create({
                ...formattedData,
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
                await DeviceModel.updateMany(
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
            const updateFields = { ...rentalData };
            if (rentalData.startRental) {
                updateFields.startRental = moment.tz(rentalData.startRental, "Asia/Ho_Chi_Minh").toDate();
            }
            if (rentalData.endRental) {
                updateFields.endRental = moment.tz(rentalData.endRental, "Asia/Ho_Chi_Minh").toDate();
            }

            await RentalScheduleModel.findByIdAndUpdate(params.id, updateFields, { returnDocument: 'after' })

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
                await DeviceModel.updateMany(
                    { _id: { $in: rentalData.deviceIds } }, // Tìm tất cả máy có ID nằm trong mảng này
                    { $set: { status: deviceStatus } }      // Cập nhật trạng thái mới
                );
            }

            return null;
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