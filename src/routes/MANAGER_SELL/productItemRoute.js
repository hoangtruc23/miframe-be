const express = require('express')
const productItemsController = require('../../controllers/MANAGER_SELL/productItemsController')
const router = express.Router()

router.get('/getAll', productItemsController.getAll)
router.post('/update/:id', productItemsController.update)

module.exports = router