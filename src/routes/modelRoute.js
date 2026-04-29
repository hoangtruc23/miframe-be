const express = require('express')
const modelController = require('../controllers/modelController')
const router = express.Router()

router.get('/getAll', modelController.getAll)
router.post('/create', modelController.create)
router.put('/update/:id', modelController.update)
router.delete('/delete/:id', modelController.delete)
module.exports = router