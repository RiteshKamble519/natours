const mongoose = require('mongoose')
const Tour = require('./tourModels')

const reviewSchema = new mongoose.Schema(
    {
        review: {
            type: String,
            require: [true, "Review cannot be empty."]
        },
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        createdAt: {
            type: Date,
            default: Date.now()
        },
        tour: {
            type: mongoose.Schema.ObjectId,
            ref: 'Tour',
            require: [true, 'Review must have a tour.']
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }
    },
    //Virtual property = Property not present in DB but is calculated outside by some other means 
    //Virtual properties should also show in JSON and Object output
    { //Object for Schema Object 
        toJSON: { virtuals: true },//Each time data is o/p as JSON make virtiuals =  true
        toObject: { virtuals: true }, //Each time data is o/p as Object make virtiuals =  true
    }
)

reviewSchema.index({ tour: 1, user: 1 }, { unique: true })

reviewSchema.pre(/^find/, function (next) {
    //populating for n fields requires calling populate n times 
    // this.populate({
    //     path: 'tour',
    //     select: 'name'
    // }).populate({
    //     path: 'user',
    //     select: 'name photo'
    // })

    this.populate({
        path: 'user',
        select: 'name photo'
    })
    next()
})

//static method
reviewSchema.statics.calcAverageRatings = async function (tourId) {
    const stats = await this.aggregate([{
        $match: { tour: tourId }
    },
    {
        $group: {
            _id: '$tour',
            nRating: { $sum: 1 },
            avgRating: { $avg: '$rating' }
        }
    }
    ])
    //    console.log("stats : ", stats)

    if (stats.length > 0) {//This will take the stats and store it in User collection in the DB
        //Tour.findByIdAndUpdate() was not working so replaced it with mongoose.model('Tour').findByIdAndUpdate()
        await mongoose.model('Tour').findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: stats[0].avgRating
        })
    }
    else {
        await mongoose.model('Tour').findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5
        })
    }
}

//post is a better suit here as we want access to reviews after they are saved in DB 
reviewSchema.post('save', function () {
    //this.construtor is the model that created this object(ie Review) 
    this.constructor.calcAverageRatings(this.tour)

    //next()
})

//To update ratings stats while updating or deleting reviews
reviewSchema.pre(/^findOneAnd/, async function (next) {
    this.r = await this.findOne()//As we need 'r' in the next post fn we are saving it to 'this' variable
    // console.log(this.r)
    next()
})

reviewSchema.post(/^findOneAnd/, async function () {
    //calcAverageRatings is a static function , we have to call it on Review model so below is the way to call it here 
    await this.r.constructor.calcAverageRatings(this.r.tour) //taking 'r' from above and then using 'tour' from that 
})

const Review = mongoose.model('Review', reviewSchema)
module.exports = Review;