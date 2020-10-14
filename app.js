//We use this file to configure our express app 
const path = require('path')
const express = require('express')
const app = express();
const fs = require('fs');
const morgan = require('morgan')
const rateLimit = require('express-rate-Limit')
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const hpp = require('hpp')

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const userRouter = require(`${__dirname}/routes/userRoutes`)
const tourRouter = require(`${__dirname}/routes/tourRoutes`)
const reviewRouter = require(`${__dirname}/routes/reviewRoutes`)
const viewRouter = require(`${__dirname}/routes/viewRoutes`)
const cookieParser = require('cookie-parser')

//Setting PUG engine.( We dont need to require it as express handles it internally)
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'))


//GLOBAL MIDDLEWARE
//Serving Static file
//app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')))

//Set security HTTP headers
app.use(helmet())

//Development logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

//Limit request from same API
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many request from this IP ,please try again in an hour'
})
app.use('/api', limiter)

//Body parser ,reading data from the body into req.body
app.use(express.json({ limit: '10kb' }));// Limit data received @10kb 
app.use(express.urlencoded({
    extended: true,
    limit: '10 kb'
}))//Its called this coz The way form sends data to server is also called urlencoded, and here we need it to process data cominig from urlencoded form
app.use(cookieParser()); //Cookie Parser

//Data sanitization against NoSQL query injection 
app.use(mongoSanitize()); //This will prevent from NoSQL query injection attacks   

//Data sanitization against XSS
app.use(xss())

//Prevent Parameter pollution 
//whiltelist tells the middleware for which parameters we should allow duplicate parameters in query 
app.use(hpp({
    whitelist: ['duration', 'ratingsAverage', 'ratingsQuantity', 'duration', 'maxGroupSize', 'difficulty', 'price']
}))


//Test middleware 
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    console.log(req.cookies)
    next();
})

//3.ROUTES

app.use('/', viewRouter)
app.use('/api/v1/tours', tourRouter)
app.use('/api/v1/users', userRouter)
app.use('/api/v1/reviews', reviewRouter)

//If this code is not placed below all the code then this error message will be send for all the routes instead of just the wrong ones
app.all('*', (req, res, next) => {  //all used for all kinds of request get ,post ,patch etc
    // res.status(404).json({
    //     status: 'fail',
    //     message: `Can't find ${req.originalUrl} on  this server!`
    // })

    // const err = new Error(`Can't find ${req.originalUrl} on  this server!`) //Creating error from inbuilt Error Object
    // err.status = 'fail'
    // err.statusCode = 404

    //When next receives an argument express assumes that an error has occured .Therefore skipping all the next in line middleware 
    //and directly going to the central error handling middleware 
    next(new AppError(`Can't find ${req.originalUrl} on  this server!`, 404))
});

//since this middleware accepts 4 parameters express knows that this is a error handling middleware 
app.use(globalErrorHandler)

module.exports = app
