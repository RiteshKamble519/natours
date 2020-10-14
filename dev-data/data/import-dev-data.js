const fs = require('fs')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const Tour = require('./../../models/tourModels')
const Review = require('./../../models/reviewModel')
const User = require('./../../models/userModel')

dotenv.config({ path: `${__dirname}/../../config.env` })//include variables from config.env to PATH

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD)

mongoose
    .connect(DB, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false
    })
    .then(() =>
        console.log('DB connection successful')
    );

//Read JSON File
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'))
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'))
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'))
//Import Data into DB
const importData = async () => {
    try {
        await Tour.create(tours)
        await User.create(users, { validateBeforeSave: false })
        await Review.create(reviews)
        console.log('Data successfully loaded')
    } catch (err) {
        console.log(err)
    }
    process.exit()
}

//Delete Data from DB
const deleteData = async () => {
    try {
        await Tour.deleteMany() //Will delete everything inside the Tour collection
        await User.deleteMany() //Will delete everything inside the Tour collection
        await Review.deleteMany() //Will delete everything inside the Tour collection
        console.log('Data successfully deleted')
    } catch (err) {
        console.log(err)
    }
    process.exit()
}

console.log(process.argv)

if (process.argv[2] == '--import') {
    importData();
}
else if (process.argv[2] == '--delete') {
    deleteData();
}