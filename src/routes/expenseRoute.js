const express = require('express')
const expenseController = require('../controllers/expenseController')
const router = express.Router()

router.get('/getAll', expenseController.getAll)
router.post('/create', expenseController.create)
router.put('/update/:id', expenseController.update)

module.exports = router