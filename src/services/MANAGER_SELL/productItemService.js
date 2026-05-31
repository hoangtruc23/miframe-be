const SellOrderModel = require("../../models/sell_Order");
const SellProductItemModel = require("../../models/sell_ProductItems");

const productItemsService = {
    dashboard: async () => {
        try {
            // Sử dụng Promise.all để chạy song song 2 câu truy vấn, tối ưu thời gian phản hồi
            const [stockStats, orderStats] = await Promise.all([

                // 1. Thống kê hàng tồn kho (từ SellProductItemModel)
                SellProductItemModel.aggregate([
                    {
                        $match: {
                            status: 'IN_STOCK'
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalItemsInStock: { $sum: 1 },
                            totalValueInStock: { $sum: '$priceImport' }
                        }
                    }
                ]),

                // 2. Thống kê tiền lời và doanh thu (từ SellOrderModel)
                SellOrderModel.aggregate([
                    {
                        // Lọc ra các đơn hàng hợp lệ. 
                        $match: {
                            status: 'PAID'
                        }
                    },
                    {
                        $group: {
                            _id: null, // Gom tất cả các đơn hàng thỏa mãn thành 1 nhóm
                            totalProfit: { $sum: '$totalProfit' },  // Tổng tiền lời
                            totalRevenue: { $sum: '$totalAmount' }  // Tổng doanh thu (tính thêm nếu bạn cần hiển thị)
                        }
                    }
                ])
            ]);

            // Xử lý dữ liệu tồn kho (nếu mảng rỗng thì gán giá trị mặc định là 0)
            const stock = stockStats.length > 0 ? stockStats[0] : { totalItemsInStock: 0, totalValueInStock: 0 };

            // Xử lý dữ liệu tiền lời/doanh thu (nếu mảng rỗng thì gán giá trị mặc định là 0)
            const orders = orderStats.length > 0 ? orderStats[0] : { totalProfit: 0, totalRevenue: 0 };

            // Trả về kết quả tổng hợp cho Dashboard
            return {
                totalItemsInStock: stock.totalItemsInStock,
                totalValueInStock: stock.totalValueInStock,
                totalProfit: orders.totalProfit,   // <--- Tổng tiền lời bạn cần lấy ở đây
                totalRevenue: orders.totalRevenue  // Tổng doanh thu 
            };

        } catch (error) {
            throw new Error(error.message);
        }
    },
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