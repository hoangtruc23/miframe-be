const supplierService = require("../../services/MANAGER_SELL/supplierService")
const response = require("../../utils/response/response")

const supplierController = {
    getAll: async (req, res, next) => {
        try {
            const result = await supplierService.getAll()
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
    create: async (req, res, next) => {
        try {
            const user = await supplierService.create(req.body)
            return res.status(200).json(response.success(user))
        } catch (error) {
            next(error)
        }
    },
    update: async (req, res, next) => {
        try {
            const result = await supplierService.update(
                req.params,
                req.body,
            )
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
}

module.exports = supplierController
