const express = require('express')
const deviceController = require('../controllers/deviceController')
const router = express.Router()

router.get('/getAll', deviceController.getAll)
router.get('/getAvailableDevices', deviceController.getAvailableDevices)
router.post('/create', deviceController.create)
router.put('/update/:id', deviceController.update)

module.exports = router