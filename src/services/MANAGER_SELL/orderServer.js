const SellCustomerModel = require("../../models/sell_Customer");
const SellOrderModel = require("../../models/sell_Order");
const mongoose = require('mongoose');
const SellProductItemModel = require("../../models/sell_ProductItems");

const orderService = {
    getAll: async () => {
        try {
            return await SellOrderModel.find()
                .populate('orderItems.productItemId customerId')
                .sort({ dateSales: -1 });
        } catch (error) {
            throw new Error(error.message);
        }
    },
    create: async (data) => {
        // Sử dụng Transaction để đảm bảo tính toàn vẹn dữ liệu
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const { items, customerName, customerPhone, customerNote } = data;

            let totalAmount = 0;
            let totalImportPrice = 0;
            const orderItems = [];

            for (const item of items) {
                // 1. Tìm máy trong kho
                const product = await SellProductItemModel.findById(item.productItemId).session(session);

                if (!product) {
                    throw new Error(`Máy không tồn tại trong hệ thống!`);
                }
                if (product.status !== 'IN_STOCK') {
                    throw new Error(`Máy có series ${product.series} đã bán hoặc đang bảo hành!`);
                }

                // 2. Lấy giá nhập tự động từ máy đó
                const priceImport = product.priceImport;
                const priceExport = Number(item.priceExport);

                orderItems.push({
                    productItemId: product._id,
                    priceExport: priceExport,
                    priceImportAtSale: priceImport
                });

                totalAmount += priceExport;
                totalImportPrice += priceImport;

                // 3. Cập nhật trạng thái máy sang SOLD
                product.status = 'SOLD';
                await product.save({ session });
            }

            // 4. Tạo mã đơn hàng duy nhất
            const orderCode = `DH${Math.floor(1000 + Math.random() * 9000)}`;

            let customer = await SellCustomerModel.findOne({ customerPhone });
            if (!customer) {
                customer = await SellCustomerModel.create({
                    name: customerName,
                    phone: customerPhone,
                    note: customerNote
                });
            }
            // 5. Lưu đơn hàng
            const newOrder = new SellOrderModel({
                orderCode,
                customerId: customer._id, // Truyền ID chuẩn vào đây
                orderItems,
                totalAmount,
                totalProfit: totalAmount - totalImportPrice,
                dateSales: new Date()
            });

            const savedOrder = await newOrder.save({ session });

            // Kết thúc transaction thành công
            await session.commitTransaction();
            session.endSession();

            return savedOrder;

        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw new Error(error.message);
        }
    },

    update: async (id, data) => {
        try {
            // Lưu ý: Hạn chế update orderItems vì sẽ ảnh hưởng đến kho và lợi nhuận
            return await SellOrderModel.findByIdAndUpdate(id, data, { new: true });
        } catch (error) {
            throw new Error(error.message);
        }
    },

    delete: async (id) => {
        try {
            // Khi xóa đơn hàng, bạn có muốn trả máy về trạng thái IN_STOCK không?
            // Đây là logic tùy chọn tùy nghiệp vụ của bạn.
            return await SellOrderModel.findByIdAndDelete(id);
        } catch (error) {
            throw new Error(error.message);
        }
    }
};

module.exports = orderService;