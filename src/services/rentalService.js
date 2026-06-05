const moment = require('moment-timezone');
const CustomerModel = require('../models/customer')
const DeviceModel = require('../models/device')
const RentalScheduleModel = require('../models/rentalSchedule')
const constant = require('../utils/constant/constant');
const ExpenseModel = require('../models/expense');

const rentalService = {
    dashboard: async (query) => {
        try {
            const { month, year } = query;
            const targetMonth = parseInt(month);
            const targetYear = parseInt(year);

            // 1. TÍNH KPI THEO SỐ DEVICE
            const deviceLength = await DeviceModel.countDocuments({ status: { $ne: 'sold' } });
            const REVENUE_TARGET = (150000 * deviceLength) * 15; // 15 ngày

            // 2. LẤY DỮ LIỆU THU CHI TỪ EXPENSEMODEL (Giữ nguyên logic múi giờ VN)
            const expenseStats = await ExpenseModel.aggregate([
                {
                    $match: {
                        status: 'paid',
                        datePaid: { $exists: true, $ne: null }
                    }
                },
                {
                    $group: {
                        _id: {
                            year: { $year: { date: "$datePaid", timezone: "+07:00" } },
                            month: { $month: { date: "$datePaid", timezone: "+07:00" } },
                            type: "$transactionType"
                        },
                        totalAmount: { $sum: "$amount" }
                    }
                },
                { $match: { "_id.year": targetYear } }
            ]);

            let currentMonthExpense = 0, currentMonthOtherIncome = 0;
            let currentYearExpense = 0, currentYearOtherIncome = 0;

            expenseStats.forEach(item => {
                if (item._id.type === 'expense') currentYearExpense += item.totalAmount;
                if (item._id.type === 'income') currentYearOtherIncome += item.totalAmount;
                if (item._id.month === targetMonth) {
                    if (item._id.type === 'expense') currentMonthExpense += item.totalAmount;
                    if (item._id.type === 'income') currentMonthOtherIncome += item.totalAmount;
                }
            });

            // 3. TÍNH TOÁN DOANH THU THUÊ MÁY & TIỀN CỌC THEO LOGIC MỚI
            const stats = await RentalScheduleModel.aggregate([
                {
                    $match: {
                        status: { $ne: "canceled" }, // Khớp với enum 'canceled' trong schema mới
                        startRental: { $exists: true, $ne: null },
                        endRental: { $exists: true, $ne: null }
                    }
                },
                {
                    // ÁP DỤNG LOGIC DÒNG TIỀN MỚI
                    $addFields: {
                        duration: {
                            $max: [1, { $dateDiff: { startDate: "$startRental", endDate: "$endRental", unit: "day" } }]
                        },
                        // Doanh thu thực tế shop giữ lại của đơn hàng này:
                        // Nếu đơn hoàn thành (completed): lấy số tiền đã thu trừ đi số tiền đã trả cọc (bao gồm luôn cả tiền phát sinh nếu có)
                        // Nếu đơn chưa hoàn thành: tạm tính bằng trường total (tiền thuê máy gốc dự kiến)
                        realRevenue: {
                            $cond: [
                                { $eq: ["$status", "completed"] },
                                { $subtract: [{ $ifNull: ["$depositPaid", 0] }, { $ifNull: ["$depositRefunded", 0] }] },
                                { $ifNull: ["$total", 0] }
                            ]
                        }
                    }
                },
                {
                    // Chia đều doanh thu thực tế cho số ngày thuê để phân bổ vào biểu đồ tháng
                    $addFields: {
                        dailyRevenue: { $divide: ["$realRevenue", "$duration"] }
                    }
                },
                { $addFields: { daysArray: { $range: [0, "$duration"] } } },
                { $unwind: "$daysArray" },
                {
                    $addFields: {
                        specificDate: { $dateAdd: { startDate: "$startRental", unit: "day", amount: "$daysArray" } }
                    }
                },
                {
                    $facet: {
                        // Nhóm doanh thu phân bổ theo tháng
                        "monthlyStats": [
                            {
                                $group: {
                                    _id: {
                                        year: { $year: { date: "$specificDate", timezone: "+07:00" } },
                                        month: { $month: { date: "$specificDate", timezone: "+07:00" } }
                                    },
                                    totalEstimated: { $sum: "$dailyRevenue" }, // Doanh thu dự kiến phân bổ
                                    actualCollected: {
                                        // Chỉ tính vào "Thực thu" khi đơn đã hoàn thành
                                        $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$dailyRevenue", 0] }
                                    }
                                }
                            },
                            { $sort: { "_id.year": -1, "_id.month": -1 } }
                        ],
                        // TÍNH QUỸ CỌC SHOP ĐANG GIỮ TRONG TAY (Các đơn trạng thái: deposit, rented, appointment)
                        "depositSummary": [
                            {
                                $match: {
                                    status: { $in: ["deposit", "rented", "appointment"] }
                                }
                            },
                            {
                                $group: {
                                    _id: null,
                                    // Tiền shop đang cầm từ khách = Khách đã CK - Tiền thuê gốc (Vì tiền thuê này tính vào doanh thu chứ không phải cọc)
                                    holdingBalance: {
                                        $sum: { $subtract: [{ $ifNull: ["$depositPaid", 0] }, { $ifNull: ["$total", 0] }] }
                                    }
                                }
                            }
                        ]
                    }
                },
                {
                    $project: {
                        currentMonth: {
                            $filter: {
                                input: "$monthlyStats",
                                as: "item",
                                cond: { $and: [{ $eq: ["$$item._id.month", targetMonth] }, { $eq: ["$$item._id.year", targetYear] }] }
                            }
                        },
                        currentYear: {
                            $filter: {
                                input: "$monthlyStats",
                                as: "item",
                                cond: { $eq: ["$$item._id.year", targetYear] }
                            }
                        },
                        highestMonthStats: { $sortArray: { input: "$monthlyStats", sortBy: { actualCollected: -1 } } },
                        monthlyStats: 1,
                        depositSummary: 1
                    }
                },
                {
                    $project: {
                        currentMonth: 1, currentYear: 1, monthlyStats: 1,
                        highestMonth: { $arrayElemAt: ["$highestMonthStats", 0] },
                        deposit: { $arrayElemAt: ["$depositSummary", 0] }
                    }
                }
            ]);

            const result = stats[0];

            // Xử lý đầu ra doanh thu thuê máy
            const monthRentalTotal = result.currentMonth[0]?.totalEstimated || 0;
            const monthRentalActual = result.currentMonth[0]?.actualCollected || 0;
            const yearRentalTotal = result.currentYear.reduce((acc, curr) => acc + curr.totalEstimated, 0);
            const yearRentalActual = result.currentYear.reduce((acc, curr) => acc + curr.actualCollected, 0);

            // Số quỹ cọc thực tế shop đang cầm của các đơn chưa thanh lý xong
            const currentHoldingDeposit = result.deposit?.holdingBalance || 0;

            // Tính toán tổng thu và lợi nhuận ròng cuối cùng
            const totalIncomeMonth = monthRentalActual + currentMonthOtherIncome;
            const netProfitMonth = totalIncomeMonth - currentMonthExpense;
            const totalIncomeYear = yearRentalActual + currentYearOtherIncome;
            const netProfitYear = totalIncomeYear - currentYearExpense;

            return {
                targetPercent: ((monthRentalActual / REVENUE_TARGET) * 100).toFixed(2),
                targetTotal: ((monthRentalTotal / REVENUE_TARGET) * 100).toFixed(2),
                highestMonth: result.highestMonth,

                // Cụm dữ liệu tiền cọc đồng bộ lên UI Card màu vàng hổ phách
                depositGroup: {
                    holdingBalance: Math.max(0, Math.round(currentHoldingDeposit)) // Tiền cọc thực tế đang giữ trong tài khoản shop
                },

                month: {
                    rentalTotal: Math.round(monthRentalTotal),     // Doanh thu dự kiến (tiền thuê máy gốc)
                    rentalActual: Math.round(monthRentalActual),   // Thực thu thực tế (đơn completed đã trừ cọc hoàn trả)
                    otherIncome: Math.round(currentMonthOtherIncome),
                    totalExpense: Math.round(currentMonthExpense),
                    netProfit: Math.round(netProfitMonth)
                },
                year: {
                    rentalTotal: Math.round(yearRentalTotal),
                    rentalActual: Math.round(yearRentalActual),
                    otherIncome: Math.round(currentYearOtherIncome),
                    totalExpense: Math.round(currentYearExpense),
                    netProfit: Math.round(netProfitYear)
                },
                statistical: result.currentYear.map(item => {
                    const expData = expenseStats.filter(e => e._id.month === item._id.month);
                    const monthExp = expData.find(e => e._id.type === 'expense')?.totalAmount || 0;
                    const monthInc = expData.find(e => e._id.type === 'income')?.totalAmount || 0;

                    return {
                        year: item._id.year,
                        month: item._id.month,
                        rentalRevenue: Math.round(item.totalEstimated),
                        rentalActual: Math.round(item.actualCollected),
                        expense: Math.round(monthExp),
                        otherIncome: Math.round(monthInc),
                        netProfit: Math.round((item.actualCollected + monthInc) - monthExp)
                    };
                })
            };
        } catch (error) {
            console.error("Dashboard Error:", error);
            throw error;
        }
    },
    // dashboard: async (query) => {
    //     try {
    //         const { month, year } = query;
    //         const targetMonth = parseInt(month);
    //         const targetYear = parseInt(year);


    //         //TÍNH KPI THEO SỐ DEVICE
    //         const deviceLength = await DeviceModel.countDocuments({ status: { $ne: 'sold' } });
    //         const REVENUE_TARGET = (150000 * deviceLength) * 15; // 15 ngày

    //         const stats = await RentalScheduleModel.aggregate([
    //             {
    //                 $match: {
    //                     status: { $ne: "cancelled" },
    //                     startRental: { $exists: true, $ne: null },
    //                     endRental: { $exists: true, $ne: null }
    //                 }
    //             },
    //             {
    //                 // Bước 1: Tính số ngày và đơn giá mỗi ngày
    //                 $addFields: {
    //                     duration: {
    //                         $max: [
    //                             1,
    //                             { $dateDiff: { startDate: "$startRental", endDate: "$endRental", unit: "day" } }
    //                         ]
    //                     },
    //                     // Nếu endRental cùng ngày startRental thì tính là 1 ngày để tránh chia cho 0
    //                 }
    //             },
    //             {
    //                 $addFields: {
    //                     dailyRevenue: { $divide: ["$total", "$duration"] }
    //                 }
    //             },
    //             {
    //                 // Bước 2: Tạo mảng các ngày thuê (mỗi phần tử là index 0, 1, 2...)
    //                 $addFields: {
    //                     daysArray: { $range: [0, "$duration"] }
    //                 }
    //             },
    //             { $unwind: "$daysArray" },
    //             {
    //                 // Bước 3: Tính toán ngày cụ thể cho từng "mảnh" doanh thu
    //                 $addFields: {
    //                     specificDate: {
    //                         $dateAdd: {
    //                             startDate: "$startRental",
    //                             unit: "day",
    //                             amount: "$daysArray"
    //                         }
    //                     }
    //                 }
    //             },
    //             {
    //                 // Bước 4: Nhóm lại theo tháng/năm của từng ngày đã phân bổ
    //                 $facet: {
    //                     "monthlyStats": [
    //                         {
    //                             $group: {
    //                                 _id: {
    //                                     year: { $year: "$specificDate" },
    //                                     month: { $month: "$specificDate" }
    //                                 },
    //                                 total: { $sum: "$dailyRevenue" },
    //                                 actualCollected: {
    //                                     $sum: {
    //                                         $cond: [{ $eq: ["$status", "completed"] }, "$dailyRevenue", 0]
    //                                     }
    //                                 }
    //                             }
    //                         },
    //                         { $sort: { "_id.year": -1, "_id.month": -1 } }
    //                     ]
    //                 }
    //             },
    //             {
    //                 $project: {
    //                     currentMonth: {
    //                         $filter: {
    //                             input: "$monthlyStats",
    //                             as: "item",
    //                             cond: {
    //                                 $and: [
    //                                     { $eq: ["$$item._id.month", targetMonth] },
    //                                     { $eq: ["$$item._id.year", targetYear] }
    //                                 ]
    //                             }
    //                         }
    //                     },
    //                     currentYear: {
    //                         $filter: {
    //                             input: "$monthlyStats",
    //                             as: "item",
    //                             cond: { $eq: ["$$item._id.year", targetYear] }
    //                         }
    //                     },
    //                     highestMonthStats: {
    //                         $sortArray: { input: "$monthlyStats", sortBy: { total: -1 } }
    //                     },
    //                     monthlyStats: 1
    //                 }
    //             },
    //             {
    //                 $project: {
    //                     currentMonth: 1,
    //                     currentYear: 1,
    //                     monthlyStats: 1,
    //                     highestMonth: { $arrayElemAt: ["$highestMonthStats", 0] }
    //                 }
    //             }
    //         ]);

    //         const result = stats[0];

    //         const monthTotal = result.currentMonth[0]?.total || 0;
    //         const monthActual = result.currentMonth[0]?.actualCollected || 0;

    //         const yearTotal = result.currentYear.reduce((acc, curr) => acc + curr.total, 0);
    //         const yearActual = result.currentYear.reduce((acc, curr) => acc + curr.actualCollected, 0);
    //         const statistical = result.currentYear
    //         return {
    //             monthTotal: Math.round(monthTotal),
    //             monthActual: Math.round(monthActual),
    //             yearTotal: Math.round(yearTotal),
    //             yearActual: Math.round(yearActual),
    //             highestMonth: result.highestMonth,
    //             targetPercent: ((monthActual / REVENUE_TARGET) * 100).toFixed(2),
    //             targetTotal: ((monthTotal / REVENUE_TARGET) * 100).toFixed(2),
    //             statistical: statistical
    //         };
    //     } catch (error) {
    //         console.error("Dashboard Error:", error);
    //         throw error;
    //     }
    // },
    // getAll: async (query) => {
    //     try {
    //         const { status, modelDevice, phone, toDate, fromDate } = query
    //         let queryCondition = {};
    //         if (status === 'active') {
    //             queryCondition.status = { $ne: "completed" };
    //         } else if (status && status !== '') {
    //             queryCondition.status = status;
    //         }
    //         if (modelDevice) {
    //             const matchedDevices = await DeviceModel.find({ modelId: modelDevice }).select('_id');
    //             const matchedDeviceIds = matchedDevices.map(d => d._id);
    //             queryCondition.deviceIds = { $in: matchedDeviceIds };
    //         }
    //         if (phone) {
    //             const customers = await CustomerModel.find({
    //                 phone: { $regex: '^' + phone }
    //             }).select('_id');
    //             const customerIds = customers.map(c => c._id);
    //             queryCondition.customerId = { $in: customerIds };
    //         }

    //         // Tạo mốc thời gian
    //         const now = new Date(); // Thời gian hiện tại để check trễ hẹn

    //         const startOfToday = new Date();
    //         startOfToday.setHours(0, 0, 0, 0);
    //         const endOfToday = new Date();
    //         endOfToday.setHours(23, 59, 59, 999);

    //         const rentals = await RentalScheduleModel.aggregate([
    //             { $match: queryCondition },
    //             {
    //                 $addFields: {
    //                     // 1. Xác định các flag cho sự kiện hôm nay
    //                     isStartToday: {
    //                         $and: [{ $gte: ["$startRental", startOfToday] }, { $lte: ["$startRental", endOfToday] }]
    //                     },
    //                     isEndToday: {
    //                         $and: [{ $gte: ["$endRental", startOfToday] }, { $lte: ["$endRental", endOfToday] }]
    //                     },
    //                     // Xác định flag trễ hẹn (Trạng thái đang thuê và endRental nhỏ hơn hiện tại)
    //                     isOverdue: {
    //                         $and: [
    //                             { $eq: ["$status", "rented"] },
    //                             { $lt: ["$endRental", now] }
    //                         ]
    //                     }
    //                 }
    //             },
    //             {
    //                 $addFields: {
    //                     // 2. Phân cấp độ ưu tiên (Priority)
    //                     priority: {
    //                         $cond: {
    //                             if: { $or: ["$isStartToday", "$isEndToday"] },
    //                             then: 0, // Ưu tiên 1: Hôm nay nhận/trả máy
    //                             else: {
    //                                 $cond: {
    //                                     if: "$isOverdue",
    //                                     then: 1, // Ưu tiên 2: Trễ hẹn trả máy
    //                                     else: 2  // Ưu tiên 3: Các đơn bình thường khác
    //                                 }
    //                             }
    //                         }
    //                     },
    //                 }
    //             },
    //             {
    //                 $sort: {
    //                     priority: 1,      // Sắp xếp theo nhóm ưu tiên trước (0 -> 1 -> 2)
    //                     startRental: 1    // Trong cùng một nhóm thì sắp xếp theo thời gian bắt đầu tăng dần
    //                 }
    //             }
    //         ]);

    //         const populatedRentals = await RentalScheduleModel.populate(rentals, [
    //             { path: 'deviceIds' },
    //             { path: 'customerId' }
    //         ]);
    //         return populatedRentals;
    //     } catch (error) {
    //         throw error
    //     }
    // },
    getAll: async (query) => {
        try {
            const { status, modelDevice, search, toDate, fromDate } = query;
            let queryCondition = {};

            if (status === 'active') {
                // queryCondition.status = { $ne: "completed" };
                queryCondition.status = { $nin: ["completed", "canceled"] };
            } else if (status && status !== '') {
                queryCondition.status = status;
            }

            if (modelDevice) {
                const matchedDevices = await DeviceModel.find({ modelId: modelDevice }).select('_id');
                const matchedDeviceIds = matchedDevices.map(d => d._id);
                queryCondition.deviceIds = { $in: matchedDeviceIds };
            }

            if (search) {
                const customers = await CustomerModel.find({
                    $or: [
                        { name: { $regex: search, $options: 'i' } },
                        { phone: { $regex: '^' + search } }
                    ]
                }).select('_id');
                const customerIds = customers.map(c => c._id);
                queryCondition.customerId = { $in: customerIds };
            }

            // ==========================================
            // XỬ LÝ MẶC ĐỊNH LỌC THEO THÁNG HIỆN TẠI
            // ==========================================
            let startFilter, endFilter;

            if (fromDate && toDate) {
                startFilter = new Date(fromDate);
                endFilter = new Date(toDate);
            } else {
                const now = new Date();

                // Đầu tháng hiện tại (Ngày 1 lúc 00:00:00.000)
                startFilter = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

                // Cuối tháng hiện tại (Ngày cuối cùng lúc 23:59:59.999)
                // Truyền tham số ngày là 0 ở tháng tiếp theo sẽ trả về ngày cuối cùng của tháng này
                endFilter = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            }

            // Lọc các đơn có thời gian thuê nằm trong hoặc giao thoa với khoảng thời gian filter
            // Thông thường, ta sẽ lọc dựa trên thời gian bắt đầu tạo đơn hoặc thời gian nhận máy nằm trong tháng
            queryCondition.startRental = { $gte: startFilter, $lte: endFilter };
            // ==========================================

            // Tạo mốc thời gian để tính toán flag ưu tiên
            const now = new Date(); // Thời gian hiện tại để check trễ hẹn

            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            const endOfToday = new Date();
            endOfToday.setHours(23, 59, 59, 999);

            const rentals = await RentalScheduleModel.aggregate([
                { $match: queryCondition },
                {
                    $addFields: {
                        // 1. Xác định các flag cho sự kiện hôm nay
                        isStartToday: {
                            $and: [{ $gte: ["$startRental", startOfToday] }, { $lte: ["$startRental", endOfToday] }]
                        },
                        isEndToday: {
                            $and: [{ $gte: ["$endRental", startOfToday] }, { $lte: ["$endRental", endOfToday] }]
                        },
                        // Xác định flag trễ hẹn (Trạng thái đang thuê và endRental nhỏ hơn hiện tại)
                        isOverdue: {
                            $and: [
                                { $eq: ["$status", "rented"] },
                                { $lt: ["$endRental", now] }
                            ]
                        }
                    }
                },
                {
                    $addFields: {
                        // 2. Phân cấp độ ưu tiên (Priority)
                        priority: {
                            $cond: {
                                if: { $or: ["$isStartToday", "$isEndToday"] },
                                then: 0, // Ưu tiên 1: Hôm nay nhận/trả máy
                                else: {
                                    $cond: {
                                        if: "$isOverdue",
                                        then: 1, // Ưu tiên 2: Trễ hẹn trả máy
                                        else: 2  // Ưu tiên 3: Các đơn bình thường khác
                                    }
                                }
                            }
                        },
                    }
                },
                {
                    $sort: {
                        priority: 1,      // Sắp xếp theo nhóm ưu tiên trước (0 -> 1 -> 2)
                        startRental: 1    // Trong cùng một nhóm thì sắp xếp theo thời gian bắt đầu tăng dần
                    }
                }
            ]);

            const populatedRentals = await RentalScheduleModel.populate(rentals, [
                { path: 'deviceIds' },
                { path: 'customerId' }
            ]);
            return populatedRentals;
        } catch (error) {
            throw error;
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
            // if (rentalData.phoneCustomer || rentalData.nameCustomer) {
            //     customer = await CustomerModel.findOneAndUpdate(
            //         { phone: rentalData.phoneCustomer }, // Filter
            //         {
            //             $inc: { times: 1 },             // Increment "times" by 1
            //             $setOnInsert: {                 // Fields set ONLY if creating new
            //                 note: rentalData.noteCustomer,
            //                 name: rentalData.nameCustomer
            //             }
            //         },
            //         {
            //             new: true,
            //             upsert: true
            //         }
            //     );
            // }

            if (rentalData.phoneCustomer && rentalData.phoneCustomer.trim() !== "") {
                customer = await CustomerModel.findOneAndUpdate(
                    { phone: rentalData.phoneCustomer },
                    {
                        $inc: { times: 1 },
                        $set: {
                            name: rentalData.nameCustomer.trim(),
                            note: rentalData.noteCustomer
                        }
                    },
                    { new: true, upsert: true }
                );
            } else if (rentalData.nameCustomer) {
                customer = await CustomerModel.create({
                    name: rentalData.nameCustomer.trim(),
                    phone: "",
                    note: rentalData.noteCustomer,
                    times: 1
                });
            }

            // 2. CHECK TRÙNG LỊCH: Nếu tìm/tạo được khách hàng, kiểm tra xem họ có đơn nào đang thuê hoặc hẹn lịch không
            if (customer) {
                const existingRental = await RentalScheduleModel.findOne({
                    customerId: customer._id,
                    status: {
                        $in: [
                            constant.STATUS_RENTAL.rented.value,     // Đang thuê
                            constant.STATUS_RENTAL.appointment.value,  // Hẹn lịch / Đặt trước (Bạn đổi lại key theo constant của bạn nhé)
                        ]
                    }
                });

                if (existingRental) {
                    // Ném ra lỗi để phía Controller bắt được và trả về client
                    throw new Error("Khách hàng này hiện đang có đơn thuê hoặc lịch hẹn chưa hoàn thành!");
                }
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