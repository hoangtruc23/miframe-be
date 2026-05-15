const express = require('express')
const supplierController = require('../../controllers/MANAGER_SELL/supplierController')
const router = express.Router()

router.get('/getAll', supplierController.getAll)
router.post('/create', supplierController.create)
router.put('/update', supplierController.update)

module.exports = router