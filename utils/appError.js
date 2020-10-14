//extending the built in 'Error' class
//All the errors will be sent through this class 
class AppError extends Error {
    constructor(message, statusCode) {
        super(message); //By setting message property of Parent we also do set incoming message prop of our incoming message

        this.statusCode = statusCode
        this.status = `{statusCode}`.startsWith('4') ? 'fail' : 'error'

        this.isOperational = true //Only those errors which go from this class will be sent to the customer(production) and hence this flag
        Error.captureStackTrace(this, this.constructor)
    }
}

module.exports = AppError;
