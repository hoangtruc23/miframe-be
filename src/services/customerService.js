const CustomerModel = require("../models/customer");

const customerService = {
    getAll: async (query) => {
        try {
            const { page, phone } = query
            const limit = 10;
            const skip = (page - 1) * limit;

            const filter = { ...query };
            delete filter.page;
            delete filter.limit;

            if (phone) {
                filter.phone = { $regex: '^' + phone, $options: 'i' };
            }

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
            throw new Error('Failed to fetch customer')
        }
    },
}

module.exports = customerService