const express = require('express')
const customerController = require('../controllers/customerController')
const router = express.Router()

router.get('/getAll', customerController.getAll)
// router.put('/update/:id', customerController.update)

module.exports = router