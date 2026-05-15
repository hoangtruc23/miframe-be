const orderService = require("../../services/MANAGER_SELL/orderServer")
const response = require("../../utils/response/response")

const orderController = {
    getAll: async (req, res, next) => {
        try {
            const result = await orderService.getAll()
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
    create: async (req, res, next) => {
        try {
            const user = await orderService.create(req.body)
            return res.status(200).json(response.success(user))
        } catch (error) {
            next(error)
        }
    },
    update: async (req, res, next) => {
        try {
            const result = await orderService.update(
                req.params,
                req.body,
            )
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
}

module.exports = orderController
