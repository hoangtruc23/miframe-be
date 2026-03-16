const jwt = require('jsonwebtoken')

const authService = require('../services/authService')
const response = require('../utils/response/response')
const { envConfig } = require('../config/envConfg')

const authController = {
    login: async (req, res, next) => {
        try {
            const { username, password } = req.body
            const accessToken = await authService.login(username, password)
            return res.status(200).json(response.success(accessToken))
        } catch (error) {
            next(error)
        }
    },
    getUserLoginDetail: async (req, res, next) => {
        try {
            const user = await authService.getUserLoginDetail(req.user)
            return res.status(200).json(response.success(user))
        } catch (error) {
            next(error)
        }
    },
    changePassword: async (req, res, next) => {
        try {
            const { newPassword } = req.body
            const changePassword = await authService.changePassword(
                req.user,
                newPassword,
            )
            return res.status(200).json(response.success(changePassword))
        } catch (error) {
            next(error)
        }
    },
    logout: async (req, res, next) => {
        try {
            const token = req.headers.authorization?.split(' ')[1]
            const payloadToken = jwt.verify(
                token,
                envConfig.JWT_ACCESS_TOKEN_PRIVATE_KEY,
            )
            const logout = await authService.logout(payloadToken)
            return res.status(200).json(response.success(logout))
        } catch (error) {
            next(error)
        }
    },
}

module.exports = authController
