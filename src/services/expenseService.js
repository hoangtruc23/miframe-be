const ExpenseModel = require("../models/expense");

const expenseService = {
    // 1. Lấy danh sách giao dịch (Có bộ lọc mở rộng)
    getAll: async (query) => {
        try {
            const { status, payer, transactionType, category } = query;
            let queryCondition = {};

            if (status && status !== 'all') {
                queryCondition.status = status;
            }
            if (payer && payer !== 'all') {
                queryCondition.payer = payer;
            }
            // Bổ sung lọc theo Thu/Chi
            if (transactionType && transactionType !== 'all') {
                queryCondition.transactionType = transactionType;
            }
            // Bổ sung lọc theo Danh mục
            if (category && category !== 'all') {
                queryCondition.category = category;
            }

            // Tìm kiếm và sắp xếp theo ngày thanh toán mới nhất
            const transactions = await ExpenseModel.find(queryCondition).sort({ datePaid: -1 });
            return transactions;
        } catch (error) {
            throw error;
        }
    },

    // 2. Tạo giao dịch mới (Thu hoặc Chi)
    create: async (data) => {
        try {
            const result = new ExpenseModel(data);
            const savedTransaction = await result.save();
            return savedTransaction;
        } catch (error) {
            throw error;
        }
    },

    // 3. Cập nhật giao dịch
    update: async (params, data) => {
        try {
            const { id } = params;
            // Thêm { new: true } để trả về data mới nhất sau khi sửa
            const result = await ExpenseModel.findByIdAndUpdate(id, data, { new: true });
            return result;
        } catch (error) {
            throw error;
        }
    },

    // 4. HÀM MỚI: Thống kê số dư, tổng thu, tổng chi
    getFinancialStats: async (query = {}) => {
        try {
            const { fromDate, toDate } = query;
            let matchCondition = { status: 'completed' }; // Thường chỉ thống kê trên các giao dịch đã hoàn thành

            // Nếu có lọc theo khoảng thời gian (Ví dụ: Thống kê tháng này)
            if (fromDate || toDate) {
                matchCondition.datePaid = {};
                if (fromDate) matchCondition.datePaid.$gte = new Date(fromDate);
                if (toDate) matchCondition.datePaid.$lte = new Date(toDate);
            }

            const stats = await ExpenseModel.aggregate([
                { $match: matchCondition },
                {
                    $group: {
                        _id: null,
                        // Nếu transactionType là 'income' thì cộng amount vào tổng thu, ngược lại cộng 0
                        totalIncome: {
                            $sum: { $cond: [{ $eq: ['$transactionType', 'income'] }, '$amount', 0] }
                        },
                        // Nếu transactionType là 'expense' thì cộng amount vào tổng chi, ngược lại cộng 0
                        totalExpense: {
                            $sum: { $cond: [{ $eq: ['$transactionType', 'expense'] }, '$amount', 0] }
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        totalIncome: 1,
                        totalExpense: 1,
                        // Số dư = Tổng Thu - Tổng Chi
                        balance: { $subtract: ['$totalIncome', '$totalExpense'] }
                    }
                }
            ]);

            // Trả về kết quả mặc định nếu chưa có giao dịch nào dữ liệu trống
            return stats[0] || { totalIncome: 0, totalExpense: 0, balance: 0 };
        } catch (error) {
            throw error;
        }
    },

    adjustBalance: async (data) => {
        try {
            const { targetBalance, note } = data; // targetBalance ví dụ là 32000000

            if (typeof targetBalance !== 'number') {
                throw new Error("Số dư mục tiêu phải là một số.");
            }

            // 1. Tính toán số dư hiện tại trên hệ thống (Income - Expense)
            const currentStats = await ExpenseModel.aggregate([
                { $match: { status: 'paid' } },
                {
                    $group: {
                        _id: null,
                        totalIncome: {
                            $sum: { $cond: [{ $eq: ["$transactionType", "income"] }, "$amount", 0] }
                        },
                        totalExpense: {
                            $sum: { $cond: [{ $eq: ["$transactionType", "expense"] }, "$amount", 0] }
                        }
                    }
                }
            ]);

            const totalIncome = currentStats[0]?.totalIncome || 0;
            const totalExpense = currentStats[0]?.totalExpense || 0;
            const currentSystemBalance = totalIncome - totalExpense; // Số dư hiện tại hệ thống đang tính toán được

            // 2. Tính toán số tiền chênh lệch cần bù trừ
            const amountDifference = targetBalance - currentSystemBalance;

            // Nếu không lệch đồng nào thì không cần làm gì cả
            if (amountDifference === 0) {
                throw new Error("Số dư hiện tại đã khớp với số dư mục tiêu, không cần điều chỉnh.");
            }

            // 3. Tự động tạo hóa đơn bổ sung (Invoice Expense) để cân bằng số dư
            let newInvoice;
            if (amountDifference > 0) {
                // Hệ thống đang thiếu tiền so với thực tế -> Tạo phiếu THU (Income)
                newInvoice = new ExpenseModel({
                    description: `[ĐIỀU CHỈNH SỐ DƯ] Cộng tiền cân đối tài khoản`,
                    amount: Math.abs(amountDifference),
                    datePaid: new Date(),
                    transactionType: 'income',
                    category: 'other', // Phân loại chi phí khác
                    status: 'paid',
                    note: note || `Điều chỉnh thủ công. Số dư cũ: ${currentSystemBalance.toLocaleString()}đ -> Số dư mới: ${targetBalance.toLocaleString()}đ`
                });
            } else {
                // Hệ thống đang thừa tiền so với thực tế -> Tạo phiếu CHI (Expense)
                newInvoice = new ExpenseModel({
                    description: `[ĐIỀU CHỈNH SỐ DƯ] Trừ tiền cân đối tài khoản`,
                    amount: Math.abs(amountDifference),
                    datePaid: new Date(),
                    transactionType: 'expense',
                    category: 'other',
                    status: 'paid',
                    note: note || `Điều chỉnh thủ công. Số dư cũ: ${currentSystemBalance.toLocaleString()}đ -> Số dư mới: ${targetBalance.toLocaleString()}đ`
                });
            }

            await newInvoice.save();

            return {
                success: true,
                message: `Điều chỉnh số dư thành công. Đã tự động tạo hóa đơn biên động ${amountDifference > 0 ? '+' : '-'}${Math.abs(amountDifference).toLocaleString()}đ`,
                data: newInvoice
            };

        } catch (error) {
            console.error("Lỗi điều chỉnh số dư:", error);
            throw new Error("Lỗi hệ thống khi điều chỉnh số dư.");
        }
    }
}

module.exports = expenseService;