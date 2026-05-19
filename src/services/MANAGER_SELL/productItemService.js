const SellProductItemModel = require("../../models/sell_ProductItems");

const productItemsService = {
    dashboard: async () => {
        try {
            const stats = await SellProductItemModel.aggregate([
                // Bước 1: Lọc ra những mặt hàng đang có trạng thái là 'IN_STOCK' (Trong kho)
                {
                    $match: {
                        status: 'IN_STOCK'
                    }
                },
                // Bước 2: Nhóm và tính tổng số tiền (priceImport)
                {
                    $group: {
                        _id: null, // null nghĩa là gom hết toàn bộ kho thành 1 nhóm
                        totalItemsInStock: { $sum: 1 }, // Tổng số lượng máy tồn kho
                        totalValueInStock: { $sum: '$priceImport' } // Tổng số tiền hàng tồn kho
                    }
                },
                // Bước 3: Định dạng lại kết quả trả về cho đẹp (Tùy chọn)
                {
                    $project: {
                        _id: 0, // Ẩn trường _id
                        totalItemsInStock: 1,
                        totalValueInStock: 1
                    }
                }
            ]);

            // Nếu kho trống (không có hàng IN_STOCK), mảng stats sẽ rỗng []
            if (stats.length === 0) {
                return {
                    totalItemsInStock: 0,
                    totalValueInStock: 0
                };
            }

            return stats[0]; // Trả về object chứa kết quả { totalItemsInStock, totalValueInStock }
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