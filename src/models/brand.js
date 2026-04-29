const { Schema, model, Types } = require('mongoose')

const brandSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    note: {
        type: String,
        required: true,
    },
    // image: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'Media'
    // },
})

const BrandModel = model('brands', brandSchema)

module.exports = BrandModel
