const customerService = require("../services/customerService")
const response = require("../utils/response/response")

const customerController = {
    getAll: async (req, res, next) => {
        try {
            const result = await customerService.getAll(req.query)
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
}

module.exports = customerController