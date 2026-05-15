const express = require('express')
const goodsReceiptController = require('../../controllers/MANAGER_SELL/goodsReceiptController')
const router = express.Router()

router.get('/getAll', goodsReceiptController.getAll)
router.post('/create', goodsReceiptController.create)
router.put('/update', goodsReceiptController.update)

module.exports = router