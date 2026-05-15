const express = require('express')
const categoriesController = require('../../controllers/MANAGER_SELL/categoriesController')
const router = express.Router()

router.get('/getAll', categoriesController.getAll)
router.post('/create', categoriesController.create)
router.put('/update', categoriesController.update)

module.exports = router