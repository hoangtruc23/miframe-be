const modelService = require("../services/modelService")
const response = require("../utils/response/response")

const modelController = {
    getAll: async (req, res, next) => {
        try {
            const result = await modelService.getAll(req.query)
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
    create: async (req, res, next) => {
        try {
            const result = await modelService.create(req.body)
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
    update: async (req, res, next) => {
        try {
            const result = await modelService.update(req.params, req.body)
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
    delete: async (req, res, next) => {
        try {
            const result = await modelService.delete(req.params)
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    }
}

module.exports = modelController