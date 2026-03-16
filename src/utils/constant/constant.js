const constant = {
    //available, rented, maintenance, sold
    STATUS_DEVICE: {
        available: {
            label: "Sẵn sàng",
            value: "available",
        },
        rented: {
            label: "Đang cho thuê",
            value: "rented",
        },
        maintenance: {
            label: "Đang bảo trì",
            value: "maintenance",
        },
        sold: {
            label: "Đã bán",
            value: "sold",
        },
    },
    // ['deposit', 'rented', 'appointment', 'completed', 'canceled'],
    STATUS_RENTAL: {
        deposit: {
            label: "Đã đặt cọc",
            value: "deposit",
        },
        rented: {
            label: "Đang thuê",
            value: "rented",
        },
        appointment: {
            label: "Hẹn lịch",
            value: "appointment",
        },
        completed: {
            label: "Đã hoàn thành",
            value: "completed",
        },
        canceled: {
            label: "Đã hủy",
            value: "canceled",
        }
    }
}

module.exports = constant