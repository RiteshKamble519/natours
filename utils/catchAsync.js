module.exports = fn => {
    return (req, res, next) => {
        //since the funct is async and async functns return promise so if there is an error that means the promise has failed 
        fn(req, res, next).catch(next) //catch will pass the error into the next function and so this error 
        //will end up in our global error handling middleware 
    }
}
