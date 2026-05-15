const mongoose = require('mongoose');
const { Schema } = mongoose;

const SellCategoriesSchema = new Schema({
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
    brand: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brands',
        required: false
    }
});

const SellCategoriesModel = mongoose.model('sellCategories', SellCategoriesSchema);

module.exports = SellCategoriesModel;