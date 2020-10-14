const express = require('express')
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController')

const router = express.Router({ mergeParams: true });

//only logged in users can use reviews
router.use(authController.protect)

router
    .route('/')
    .get(reviewController.getAllReviews)
    .post(authController.protect, authController.restrictTo('user'), reviewController.setTourUserIds, reviewController.createReview)

router
    .route('/:id')
    .get(reviewController.getReview)
    .delete(authController.restrictTo('user', 'admin'), reviewController.deleteReview)
    .patch(authController.restrictTo('user', 'admin'), reviewController.updateReview)
module.exports = router
