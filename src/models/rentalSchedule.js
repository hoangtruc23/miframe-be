const { Schema, model, Types } = require('mongoose')
const ExpenseModel = require("../models/expense")

const rentalScheduleSchema = new Schema({
    deviceIds: [{
        type: Types.ObjectId,
        ref: 'devices',
        required: true,
    }],
    startRental: {
        type: Date,
        required: true,
    },
    endRental: {
        type: Date,
        required: true,
    },
    customerId: {
        type: Types.ObjectId,
        ref: 'customers',
        required: false,
    },
    discount: {
        type: Number,
        required: false,
    },
    days: {
        type: Number,
        required: false,
    },
    total: {
        type: Number,
        required: true,
    },
    depositPaid: { // Đã chuyển khoản
        type: Number,
        required: false,
    },
    depositRefunded: { // SỐ TIỀN CỌC ĐÃ HOÀN TRẢ LẠI CHO KHÁCH KHI TRẢ MÁY
        type: Number,
        required: false,
        default: 0
    },
    note: { //Ghi chú
        type: String,
        required: false,
    },
    status: {
        type: String,
        required: true,
        enum: ['rented', 'appointment', 'completed', 'canceled'],
    },
})

// TRUNG TÂM XỬ LÝ LOGIC TỰ ĐỘNG CẬP NHẬT BIẾN ĐỘNG SỐ DƯ (BALANCE) THÔNG QUA EXPENSE
rentalScheduleSchema.post('save', async function (doc) {
    try {
        // 1. XỬ LÝ KHI NHẬN TIỀN KHÁCH CHUYỂN KHOẢN (Trạng thái cọc hoặc đang thuê hoặc hoàn thành)
        if (['rented', 'completed'].includes(doc.status) && doc.depositPaid > 0) {
            // Kiểm tra xem đã tạo phiếu Thu cho đơn này chưa bằng cách tìm theo description độc nhất
            const uniqueDescription = `Thu tiền đơn thuê máy mã: ${doc._id}`;

            await ExpenseModel.findOneAndUpdate(
                { description: uniqueDescription },
                {
                    description: uniqueDescription,
                    amount: doc.depositPaid,
                    datePaid: doc.startRental || new Date(),
                    transactionType: 'income',
                    category: 'revenue',
                    status: 'paid',
                    note: `Tổng tiền nhận từ khách (Gồm tiền thuê và cọc máy). Ghi chú đơn: ${doc.note || 'Không'}`
                },
                { upsert: true, new: true } // Nếu chưa có thì tạo mới, có rồi thì cập nhật lại số tiền phòng khi bạn sửa đơn
            );
        }

        // 2. XỬ LÝ KHI HOÀN CỌC CHO KHÁCH (Khi trạng thái chuyển sang completed)
        const refundDescription = `Hoàn trả cọc đơn thuê máy mã: ${doc._id}`;
        if (doc.status === 'completed' && doc.depositRefunded > 0) {
            await ExpenseModel.findOneAndUpdate(
                { description: refundDescription },
                {
                    description: refundDescription,
                    amount: doc.depositRefunded,
                    datePaid: doc.endRental || new Date(),
                    transactionType: 'expense',
                    category: 'other', // Hoặc bạn có thể bổ sung thêm enum 'refund' vào schema nếu muốn phân loại riêng
                    status: 'paid',
                    note: `Hoàn trả lại tiền cọc thừa cho khách sau khi trừ các chi phí phát sinh.`
                },
                { upsert: true, new: true }
            );
        } else {
            // Nếu trạng thái đổi từ completed về trạng thái khác, hoặc số tiền hoàn trả = 0, xóa phiếu Chi hoàn cọc cũ nếu có
            await ExpenseModel.deleteOne({ description: refundDescription });
        }

        // 3. XỬ LÝ KHI ĐƠN BỊ HỦY (Canceled)
        if (doc.status === 'canceled') {
            // Xóa luôn phiếu Thu ban đầu nếu đơn hủy và shop trả lại toàn bộ tiền ngay từ đầu không lưu vết thu
            // Hoặc giữ phiếu thu cũ nhưng tạo phiếu chi trả lại (Tùy thuộc quy trình của bạn, ở đây hỗ trợ xóa sạch dòng tiền đơn hủy)
            await ExpenseModel.deleteOne({ description: `Thu tiền đơn thuê máy mã: ${doc._id}` });
            await ExpenseModel.deleteOne({ description: refundDescription });
        }

    } catch (error) {
        console.error("Lỗi tự động cập nhật số dư qua Expense Hook:", error);
    }
});

// Thêm hook khi xóa hẳn một đơn thuê ra khỏi DB (nếu có tính năng xóa đơn)
rentalScheduleSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        await ExpenseModel.deleteMany({
            description: { $regex: doc._id.toString() }
        });
    }
});

const RentalScheduleModel = model('rentalSchedules', rentalScheduleSchema)

module.exports = RentalScheduleModel
