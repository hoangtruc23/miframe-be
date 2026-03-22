const express = require('express')
const router = express.Router()
const deviceRoute = require('./deviceRoute')
const rentalRoute = require('./rentalRoute')
const expenseRoute = require('./expenseRoute')

router.use('/device', deviceRoute)
router.use('/rental', rentalRoute)
router.use('/expense', expenseRoute)

module.exports = router