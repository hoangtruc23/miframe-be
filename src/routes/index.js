const express = require('express')
const router = express.Router()
const deviceRoute = require('./deviceRoute')
const rentalRoute = require('./rentalRoute')

router.use('/device', deviceRoute)
router.use('/rental', rentalRoute)

module.exports = router