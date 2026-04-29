const express = require('express')
const deviceController = require('../controllers/deviceController')
const router = express.Router()

router.get('/getAll', deviceController.getAll)
router.get('/getAllModelDevice', deviceController.getAllModelDevice)
router.get('/getAvailableDevices', deviceController.getAvailableDevices)
router.post('/create', deviceController.create)
router.put('/update/:id', deviceController.update)
router.get('/delete/:id', deviceController.delete)

module.exports = router