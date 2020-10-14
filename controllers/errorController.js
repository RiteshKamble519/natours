const AppError = require('./../utils/appError')

const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`
    return new AppError(message, 404);
}

const handleDuplicateFieldsDB = (err) => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0]
    console.log("value", value);
    const message = `Duplicate field value : ${value} .Please use another value`

    return new AppError(message, 400)
}

const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map(el => el.message)

    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400)
}

const sendErrorDev = (err, req, res) => {

    //A. If URL is not original then render the error page 
    if (req.originalUrl.startsWith('/api')) {
        console.log('Error', err)
        return res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        })
    }
    //B. Rendered Website
    console.log('Error', err)
    return res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        msg: err.message
    });


}

const handleJWTError = () => new AppError('Invalid token .Please login again', 401)

const handleJWTExpiredError = () => new AppError('Your token has expired.Please login again', 401)

const sendErrorProd = (err, req, res) => {
    if (req.originalUrl.startsWith('/api')) {
        //A. Operational ,trusted errors 
        if (err.isOperational) {
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message
            })
        }
        //B. Rendered Website 
        //Unnecessary details should not be exposed to client  //Visible to developers
        console.log('Error', err)

        //Visible to client 
        return res.status(500).json({
            status: 'error',
            message: 'Something went wrong!'
        })
    }
    //A. Operational ,trusted errors
    if (err.isOperational) {
        return res.status(err.statusCode).render('error', {
            title: 'Something went wrong!',
            msg: err.message
        });
    }
    //Unnecessary details should not be exposed to client  //Visible to developers
    console.log('Error', err)

    //B. Rendered Website
    //Visible to client 
    return res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        msg: 'Please try again later.'
    });
}

module.exports = (err, req, res, next) => {
    //console.log(err.stack)
    //Each err has this stack property .This shows where exactly the error happened 

    err.statusCode = err.statusCode || 500 // 500 stands for internal server error
    err.status = err.status || 'error'

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res)
    }
    else if (process.env.NODE_ENV === 'production') {
        let error = { ...err }//Here err.message is not copied to error, to fix this next step is done.Issue caught in production
        error.message = err.message

        if (error.name === 'CastError') {
            error = handleCastErrorDB(error);
        }
        if (error.code == 11000) {
            error = handleDuplicateFieldsDB(error);
        }
        if (error.name == 'ValidationError') {
            error = handleValidationErrorDB(error)
        }
        if (error.name == 'JsonWebTokenError') {
            error = handleJWTError()
        }
        if (error.name == 'TokenExpiredError') {
            error = handleJWTExpiredError()
        }
        sendErrorProd(error, req, res)
    }
}
