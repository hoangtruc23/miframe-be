const { default: mongoose } = require('mongoose');
const SellGoodsReceiptModel = require('../../models/sell_GoodsReceipt');
const SellReceiptDetailModel = require('../../models/sell_ReceiptDetail');
const SellProductItemModel = require('../../models/sell_ProductItems');

const goodsReceiptService = {
    getAll: async () => {
        try {
            const receipts = await SellGoodsReceiptModel.find()
                .populate('supplierId', 'name phone') // Lấy tên & SĐT nhà cung cấp từ bảng suppliers
                .populate({
                    path: 'receiptDetails', // Lấy mảng ID chi tiết mặt hàng
                    populate: {
                        path: 'categoriesId', // Lồng tiếp để lấy tên loại máy từ bảng sellCategories
                        select: 'name brands'
                    }
                })
                .sort({ date: -1 }); // Phiếu mới nhất xếp lên đầu

            return receipts;
        } catch (error) {
            throw new Error(error.message);
        }
    },
    // 2. TẠO PHIẾU NHẬP HÀNG ĐA SẢN PHẨM (Xử lý lưu cả Detail lẫn Receipt)
    create: async (data) => {

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const { supplierId, total, note, date, details } = data;

            // BƯỚC 1: Tạo các dòng chi tiết hóa đơn (SellReceiptDetail) trước để lấy ID
            const detailPromises = details.map(item => {
                return SellReceiptDetailModel.create({
                    categoriesId: item.categoriesId,
                    quality: item.quality,
                    priceImport: item.priceImport,
                    note: item.note || ''
                });
            });
            const savedDetails = await Promise.all(detailPromises);
            const detailIds = savedDetails.map(detail => detail._id);

            // BƯỚC 2: Tạo phiếu nhập tổng (SellGoodsReceipt)
            const newReceipt = await SellGoodsReceiptModel.create({
                supplierId: supplierId || null,
                receiptDetails: detailIds,
                total: total,
                date: date || new Date(),
                note: note || ''
            });

            // BƯỚC 3: Tạo từng chiếc máy vật lý dựa trên số Series (SellProductItem)
            const productItemRecords = [];

            // Duyệt qua từng loại mặt hàng có trong danh sách details gửi lên từ Frontend
            for (const item of details) {
                for (let i = 0; i < item.quality; i++) {
                    const currentSeries = item.series && item.series[i] ? item.series[i].trim() : `AUTO-GENERATED-${Date.now()}-${i}`;

                    productItemRecords.push({
                        categoriesId: item.categoriesId,
                        series: currentSeries, // Số series cụ thể của máy này
                        priceImport: item.priceImport, // Lưu lại giá nhập tại thời điểm này của riêng máy này
                        goodsReceiptId: newReceipt._id, // Liên kết ngược lại xem máy này nằm trong phiếu nhập nào
                        status: 'IN_STOCK', // Mặc định vừa nhập kho là có sẵn để bán
                        dateImport: date || new Date()
                    });
                }
            }

            // Tiến hành insert hàng loạt (Bulk Insert) tất cả các máy lẻ vào database cho nhẹ hệ thống
            if (productItemRecords.length > 0) {
                await SellProductItemModel.insertMany(productItemRecords);
            }

            await session.commitTransaction();
            return newReceipt;
        } catch (error) {
            await session.abortTransaction();
            throw new Error(error.message);
        } finally {
            // Luôn luôn đóng session sau khi kết thúc công việc
            session.endSession();
        }
    },
    // 3. CẬP NHẬT PHIẾU NHẬP
    update: async (params, data) => {
        try {
            const { id } = params; // Ví dụ truyền params là { id: '...' }

            const updatedReceipt = await SellGoodsReceiptModel.findByIdAndUpdate(
                id,
                { $set: data },
                { new: true } // Trả về data sau khi đã update xong
            );

            if (!updatedReceipt) throw new Error("Không tìm thấy phiếu nhập kho!");
            return updatedReceipt;
        } catch (error) {
            throw new Error(error.message);
        }
    },

    // 4. XÓA PHIẾU NHẬP KHO (Xóa phiếu chính và dọn dẹp luôn các Detail liên quan)
    delete: async (params) => {
        try {
            const { id } = params;

            // Bước A: Tìm phiếu nhập kho xem có tồn tại không để lấy mảng ID chi tiết
            const receipt = await SellGoodsReceiptModel.findById(id);
            if (!receipt) throw new Error("Không tìm thấy phiếu nhập kho để xóa!");

            // Bước B: Xóa sạch toàn bộ các dòng hàng chi tiết thuộc phiếu này trong bảng Detail
            if (receipt.receiptDetails && receipt.receiptDetails.length > 0) {
                await SellReceiptDetailModel.deleteMany({
                    _id: { $in: receipt.receiptDetails }
                });
            }

            // Bước C: Xóa phiếu nhập chính
            await SellGoodsReceiptModel.findByIdAndDelete(id);

            return { message: "Xóa thành công phiếu nhập kho và các chi tiết liên quan!" };
        } catch (error) {
            throw new Error(error.message);
        }
    }
};

module.exports = goodsReceiptService;