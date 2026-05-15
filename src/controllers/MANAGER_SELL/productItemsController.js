const productItemsService = require("../../services/MANAGER_SELL/productItemService")
const response = require("../../utils/response/response")

const productItemsController = {
    getAll: async (req, res, next) => {
        try {
            const result = await productItemsService.getAll(req.query)
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
    update: async (req, res, next) => {
        try {
            const result = await productItemsService.update(req.params, req.body)
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
}

module.exports = productItemsController
