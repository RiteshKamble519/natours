const express = require('express');
const router = express.Router()
const tourController = require('./../controllers/tourController')
const authController = require('./../controllers/authController')
const reviewRouter = require('./../routes/reviewRoutes')
// router.param('id', tourController.checkID)

//Redirecting 
router.use('/:tourId/reviews', reviewRouter)

router
    .route('/top-5-cheap')
    .get(tourController.aliasTopTours, tourController.getAllTours)

router.route('/tour-stats').get(tourController.getTourStats)
router.route('/monthly-plan/:year').get(authController.protect, authController.restrictTo('admin', 'lead-guide', 'guide'), tourController.getMonthlyPlan)

//Normal route implemented till now => /tours-within?distance=233&centre=-40,45&unit=mi
//This route => /tours-within/:233/centre/-40,45/unit/mi
//This is a more standard way of doing things 
router
    .route('/tours-within/:distance/centre/:latlng/unit/:unit')
    .get(tourController.getToursWithin)

router
    .route('/distances/:latlng/unit/:unit')
    .get(tourController.getDistances)

router
    .route('/')
    .get(tourController.getAllTours)//If user is not authenticate then next middleware will not execute 
    .post(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.createTour)//Here all the checks necesssary for creating tour can be put at checkBody's position 

router
    .route('/:id')
    .get(tourController.getTour)
    .patch(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.updateTour)
    //only admin and lead-guide are allowed to delete
    .delete(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.deleteTour)


module.exports = router
