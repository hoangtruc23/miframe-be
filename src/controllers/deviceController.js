const deviceService = require('../services/deviceService')
const response = require('../utils/response/response')
const deviceController = {
    getAll: async (req, res, next) => {
        try {
            const result = await deviceService.getAll(req.query)
            // res.json({ devices: result, success: true })
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
    getAvailableDevices: async (req, res, next) => {
        try {
            const result = await deviceService.getAvailableDevices(req.query)
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
    create: async (req, res, next) => {
        try {
            const result = await deviceService.create(req.body)
            // res.json({ devices: result, success: true })
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
    update: async (req, res, next) => {
        try {
            const result = await deviceService.update(req.params, req.body)
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
}

module.exports = deviceController