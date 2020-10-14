const express = require('express')
const router = express.Router()
const viewsController = require('./../controllers/viewsController')
const authController = require('./../controllers/authController')


//router.use() //So this middleware will be included for all the below middlewares
router.get('/', authController.isLoggedIn, viewsController.getOverview)

//Eg link : http://127.0.0.1:3000/tours/the-forest-hiker
router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour)
router.get('/login', authController.isLoggedIn, viewsController.getLoginForm)
router.get('/me', authController.protect, viewsController.getAccount)
router.post('/submit-user-data', authController.protect, viewsController.updateUserData)

module.exports = router
