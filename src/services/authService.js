const moment = require('moment-timezone');
const constant = require('../utils/constant/constant');
const UsersModel = require('../models/users');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_ACCESS_TOKEN_PRIVATE_KEY || 'project-miframe-key';
const JWT_EXPIRES = process.env.JWT_ACCESS_TOKEN_EXPIRES || '1d';

const authService = {
    getAll: async () => {
        try {
            return await UsersModel.find();
        } catch (error) {
            throw error;
        }
    },

    login: async (data) => {
        try {
            const { username, password } = data;

            // 2. Kiểm tra xem user có tồn tại không
            const user = await UsersModel.findOne({ username });
            if (!user) {
                throw new Error('Invalid username or password');
            }

            // 3. Kiểm tra mật khẩu
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                throw new Error('Invalid username or password');
            }

            // 4. Tạo Payload (thông tin đính kèm trong token)
            const payload = {
                id: user._id,
                username: user.username,
                role: user.role // Thêm role nếu ứng dụng của bạn có phân quyền
            };

            // 5. Ký và tạo token (hết hạn sau 1 ngày)
            const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });

            // 6. Trả về cả thông tin user (đã ẩn password) và token
            const userResponse = user.toObject();
            delete userResponse.password;

            return {
                user: userResponse,
                token
            };

        } catch (error) {
            throw error;
        }
    },

    create: async (data) => {
        try {
            if (data.password) {
                const salt = await bcrypt.genSalt(10);
                data.password = await bcrypt.hash(data.password, salt);
            }
            return await UsersModel.create(data);
        } catch (error) {
            throw error;
        }
    },

    update: async (params, data) => {
        try {
            const { id } = params;
            if (data.password) {
                const salt = await bcrypt.genSalt(10);
                data.password = await bcrypt.hash(data.password, salt);
            }
            const updatedUser = await UsersModel.findByIdAndUpdate(id, data, { new: true });
            if (!updatedUser) throw new Error('User not found');
            return updatedUser;
        } catch (error) {
            throw error;
        }
    },

    delete: async (params) => {
        try {
            const { id } = params;
            const result = await UsersModel.findByIdAndDelete(id);
            if (!result) throw new Error('User not found or already deleted');
            return result;
        } catch (error) {
            throw error;
        }
    }
};

module.exports = authService;