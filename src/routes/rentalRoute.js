const express = require('express')
const rentalController = require('../controllers/rentalController')
const router = express.Router()

router.get('/dashboard', rentalController.dashboard)
router.get('/getAll', rentalController.getAll)
router.get('/getRentalToday', rentalController.getRentalToday)
router.post('/create', rentalController.create)
router.put('/update/:id', rentalController.update)
router.get('/delete/:id', rentalController.delete)

module.exports = router