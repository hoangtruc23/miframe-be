const goodsReceiptService = require("../../services/MANAGER_SELL/goodsReceiptService")
const response = require("../../utils/response/response")

const goodsReceiptController = {
    getAll: async (req, res, next) => {
        try {
            const result = await goodsReceiptService.getAll()
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
    create: async (req, res, next) => {
        try {
            const user = await goodsReceiptService.create(req.body)
            return res.status(200).json(response.success(user))
        } catch (error) {
            next(error)
        }
    },
    update: async (req, res, next) => {
        try {
            const result = await goodsReceiptService.update(
                req.params,
                req.body,
            )
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
}

module.exports = goodsReceiptController
