const express = require('express')
const router = express.Router()

router.post('/login', authController.login)
router.get('/getUserLoginDetail', authController.getUserLoginDetail)
router.put('/changePassword', authController.changePassword)
router.get('/logout', authController.logout)

module.exports = router