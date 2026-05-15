const express = require('express')
const orderController = require('../../controllers/MANAGER_SELL/orderController')
const router = express.Router()

router.get('/getAll', orderController.getAll)
router.post('/create', orderController.create)
// router.put('/update', orderController.update)

module.exports = router