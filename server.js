const mongoose = require('mongoose')
const dotenv = require('dotenv')
dotenv.config({ path: `${__dirname}/config.env` })
const app = require('./app');   //We need to require the app only after declaring the process variable if reversed the we couldnt read those variables

//console.log(process.env)

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD)

//
process.on('uncaughtException', err => {
    console.log(err.name, err.message)
    console.log('Unhandled Exception ...Shutting down the server!!')
    process.exit(1) //1 = Some error 0 = no error
})



mongoose
    .connect(DB, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false
    })
    .then(() =>
        console.log('DB connection successful')
    );


//START SERVER
const port = process.env.PORT || 3000
const server = app.listen(port, () => {
    console.log(`App running on port ${port}..`)
})

//handling unhandled errors
process.on('unhandledRejection', err => {
    console.log(err.name, err.message)
    //Using just process.exit will end all the ongoing processes abruptly .
    //So we use server.close which closes lets all the ongoing process to complete and then exits gracefully 
    console.log('Unhandled Rejection ...Shutting down the server!!')
    server.close(() => {
        process.exit(1) //1 = Some error 0 = no error
    })

})

