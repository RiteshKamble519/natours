const Tour = require('./../models/tourModels')
const User = require('./../models/userModel')
const catchAsync = require('./../utils/catchAsync')
const AppError = require('./../utils/appError')

exports.getOverview = catchAsync(async (req, res, next) => {
    //1. Get tour data from collection
    const tours = await Tour.find()

    //2. Build template

    //3. Render the template using tour data from step 1 

    res.status(200).render('overview', {
        //These variables are called 'locals' in pug file
        title: 'All Tours',
        tours
    })
})

exports.getTour = catchAsync(async (req, res, next) => {

    //Get data from requested tour (including reviews and guides)
    const tour = await Tour.findOne({ slug: req.params.slug }).populate({
        path: 'reviews',
        fields: 'review rating user'
    })

    if (!tour) {
        return next(new AppError('There is no tour with that name.', 404))
    }

    //2. Build Template

    //3.Render template using data from step 1
    res.status(200).render('tour', {
        title: `${tour.name} Tour`,
        tour
    })
})

exports.getLoginForm = catchAsync(async (req, res, next) => {
    res.status(200).render('login', {
        title: 'Log into your account'
    })
})

exports.getAccount = (req, res) => {
    res.status(200).render('account', {
        title: 'Your account'
    })
}

exports.updateUserData = catchAsync(async (req, res, next) => {
    //By just using name and email we are just changing those particular artibutes and not entire thing
    const updatedUser = await User.findByIdAndUpdate(req.user.id, {
        name: req.body.name,
        email: req.body.email
    },
        {
            new: true,
            runValidators: true
        }
    )
    res.status(200).render('account', {
        title: 'Your account',
        user: updatedUser
    })
})

