const categoriesService = require("../../services/MANAGER_SELL/categoriesService")
const response = require("../../utils/response/response")

const categoriesController = {
    getAll: async (req, res, next) => {
        try {
            const result = await categoriesService.getAll()
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
    create: async (req, res, next) => {
        try {
            const user = await categoriesService.create(req.body)
            return res.status(200).json(response.success(user))
        } catch (error) {
            next(error)
        }
    },
    update: async (req, res, next) => {
        try {
            const result = await categoriesService.update(
                req.params,
                req.body,
            )
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
}

module.exports = categoriesController
