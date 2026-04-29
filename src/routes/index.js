const express = require('express')
const router = express.Router()
const deviceRoute = require('./deviceRoute')
const rentalRoute = require('./rentalRoute')
const expenseRoute = require('./expenseRoute')
const customerRoute = require('./customerRoute')
const modelRoute = require('./modelRoute')

router.use('/device', deviceRoute)
router.use('/rental', rentalRoute)
router.use('/expense', expenseRoute)
router.use('/customers', customerRoute)
router.use('/models', modelRoute)

module.exports = router