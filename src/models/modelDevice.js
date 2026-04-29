const mongoose = require('mongoose');
const { Schema } = mongoose;

const ModelDeviceSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    note: {
        type: String
    },
    // image: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'Media'
    // },
    pricePerDay: {
        type: Number,
        required: false
    },
    isForSale: {
        type: Boolean,
        default: true
    },
    isForRent: {
        type: Boolean,
        default: false
    },
    brand: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brands',
        required: false
    }
}, {
    timestamps: true // Tự động thêm createdAt và updatedAt
});

const ModelDevice = mongoose.model('modelDevices', ModelDeviceSchema);

module.exports = ModelDevice;