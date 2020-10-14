const express = require('express');
const userController = require('./../controllers/userController')
const authController = require('./../controllers/authController')
const router = express.Router()

// router
//.route('/signup')
//.post(authController.signup)

router.post('/signup', authController.signup)
router.post('/login', authController.login)
router.get('/logout', authController.logout)
router.post('/forgotPassword', authController.forgotPassword)
router.patch('/resetPassword/:token', authController.resetPassword)

//From here all routes are protected so adding 'protect' to the router itself to minimize repetition in code
router.use(authController.protect)
router.patch('/updateMyPassword', authController.updatePassword)
router.patch('/updateMe', userController.updateMe)
router.delete('/deleteMe', userController.deleteMe)
router.get('/me', userController.getMe, userController.getUser)

//From here all routes are accessible only to 'admin'so adding it to the router itself to minimize repetition in code
router.use(authController.restrictTo('admin'))

router
    .route('/')
    .get(userController.getAllUsers)
    .post(userController.createUsers)

router
    .route('/:id')
    .get(userController.getUser)
    .patch(userController.updateUser)
    .delete(userController.deleteUser)


module.exports = router 
