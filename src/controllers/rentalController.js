const rentalService = require("../services/rentalService")
const response = require("../utils/response/response")

const rentalController = {
    dashboard: async (req, res, next) => {
        try {
            const result = await rentalService.dashboard()
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
    getAll: async (req, res, next) => {
        try {
            const result = await rentalService.getAll(req.query)
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
    getRentalToday: async (req, res, next) => {
        try {
            const result = await rentalService.getRentalToday()
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
    create: async (req, res, next) => {
        try {
            const result = await rentalService.create(req.body)
            // res.json({ rentals: result })
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
    update: async (req, res, next) => {
        try {
            const result = await rentalService.update(req.params, req.body)
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
    delete: async (req, res, next) => {
        try {
            const result = await rentalService.delete(req.params)
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
}

module.exports = rentalController