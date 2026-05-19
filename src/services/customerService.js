const CustomerModel = require("../models/customer");

const customerService = {
    getAll: async (query) => {
        try {
            const page = parseInt(query.page) || 1;
            const limit = 10;
            const skip = (page - 1) * limit;

            const filter = {};

            // Nếu Frontend truyền lên tham số search (ví dụ: ?search=0987 hoặc ?search=Nam)
            if (query.search) {
                const searchRegex = { $regex: query.search, $options: 'i' };

                // Tìm kiếm theo cơ chế: PHONE khớp HOẶC NAME khớp
                filter.$or = [
                    { phone: searchRegex },
                    { name: searchRegex }
                ];
            }

            // Thực hiện truy vấn với filter $or vừa tạo
            const customers = await CustomerModel.find(filter)
                .sort({ times: -1 })
                .skip(skip)
                .limit(limit);

            const totalCustomers = await CustomerModel.countDocuments(filter);

            return {
                data: customers,
                pagination: {
                    total: totalCustomers,
                    page: page,
                    limit: limit,
                    totalPages: Math.ceil(totalCustomers / limit)
                }
            };
        } catch (error) {
            console.error("Error in getAll customers:", error);
            throw new Error('Failed to fetch customer');
        }
    },
    update: async (params, data) => {
        try {
            const { id } = params
            const result = await CustomerModel.findByIdAndUpdate(id, data)
            return result
        } catch (error) {
            throw error
        }
    },
}

module.exports = customerService