const express = require('express')
const rentalController = require('../controllers/rentalController')
const router = express.Router()

router.get('/dashboard', rentalController.dashboard)
router.get('/getAll', rentalController.getAll)
router.post('/create', rentalController.create)
router.put('/update/:id', rentalController.update)

module.exports = router