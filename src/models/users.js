const { Schema, model, Types } = require('mongoose')

const usersSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        required: true,
        enum: ['admin', 'staff', 'viewer']
    },
})

const UsersModel = model('users', usersSchema)

module.exports = UsersModel
