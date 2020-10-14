const mongoose = require('mongoose')
const slugify = require('slugify')
const validator = require('validator');
const User = require('./userModel');
const Review = require('./reviewModel');

const tourSchema = new mongoose.Schema(
    {
        //Schema type options : type,required,unique,default
        //this could have been a normal key-value pair also 
        //Object for Schema defination
        name: {
            type: String,
            required: [true, 'A tour must have a name'],
            unique: true,
            trim: true, //Removes all the white space from data
            maxlength: [40, 'A tour name must have less than or equal to 40 characters '],
            minlength: [10, 'A tour name must have more than or equal to 10 characters '],
            // Just used for DEMO --> validate: [validator.isAlpha, 'Tour name must only contain charaters']
        },
        slug: String,
        duration: {
            type: Number,
            required: [true, 'A tour must have a duration']
        },
        maxGroupSize: Number,
        difficulty: {
            type: String,
            required: [true, 'A tour must have a difficulty'],
            enum: {
                values: ['easy', 'medium', 'difficult'],
                message: 'Difficulty is either : easy, medium or difficult'
            }
        },
        ratingsAverage: {
            type: Number,
            default: 4.5,
            min: [1, 'Rating must be above 1.0'],
            max: [5, 'Rating must be below 5.0'],
            set: val => Math.round(val * 10) / 10 //set function will run everytime ratingsAverage value is set
        },
        ratingsQuantity: {
            type: Number,
            default: 0
        },
        price: {
            type: Number,
            required: [true, 'A tour must have a price']
        },
        priceDiscount: {
            type: Number,
            validate: {
                //This is eg of custom validation 
                //'this' variable point to current doc only for create and not for update ops
                validator: function (val) {
                    return val < this.price
                },
                message: 'Discount price ({VALUE}) should be below regular price'
            }
        },
        summary: {
            type: String,
            trim: true, //Removes all the white space from data
            required: [true, 'A tour must have a summary']
        },
        description: {
            type: String,
            trim: true
        },
        imageCover: {
            type: String,
            required: [true, 'A tour must have a cover image']
        },
        images: [String], //An Array
        createdAt: {
            type: Date,
            default: Date.now(),
            select: false
        },
        startDates: [Date], //An Array
        secretTour: {
            type: Boolean,
            default: false
        },
        startLocation: {
            //GeoJSON
            type: {
                type: String,
                default: 'Point',
                enum: ['Point'] //So that this will not have any other data type
            },
            coordinates: ['Number'],
            address: String,
            description: String
        },
        locations: [  //GeoJSON
            //This array of Object will create new documents inside the parent document ie Tour 
            {   //This type is called Schema Type defination 
                type: {
                    type: String,
                    default: 'Point',
                    enum: ['Point'] //So that this will not have any other data type
                },
                coordinates: ['Number'],
                address: String,
                description: String,
                day: Number
            }
        ],
        //guides: Array //11. Modelling Data and Advanced Mongoose / 5. Modelling Tour Guides Embedding CODE
        guides: [
            {   //This type is called Schema Type defination 
                //We expect this data to be an Object in mongoDB
                type: mongoose.Schema.ObjectId,
                ref: 'User' //We dont need to require(User) for this to work.Here User is imported behind the scenes 
            }
        ]
    },
    { //Object for Schema Object 
        toJSON: { virtuals: true },//Each time data is o/p as JSON make virtiuals =  true
        toObject: { virtuals: true }, //Each time data is o/p as Object make virtiuals =  true
    }
)

tourSchema.index({ price: 1, ratingsAverage: -1 })
tourSchema.index({ slug: 1 })
tourSchema.index({ startLocation: '2dsphere' })//This is telling MongoDB that start location should be indexing to a 2d sphere(earthlike)

tourSchema.virtual('durationWeeks').get(function () {
    return this.duration / 7
})

//Virtual Populate
tourSchema.virtual('reviews', {
    ref: 'Review', //Name of Model 
    foreignField: 'tour', //Name of same field in above Model
    localField: '_id' //Name of field in this model
});

//DOCUMENT MIDDLEWARE :
//'save' runs on .create() and .save() and not on .insertMany or any other  
tourSchema.pre('save', function (next) {
    this.slug = slugify(this.name, { lower: true });
    next()
})

//11. Modelling Data and Advanced Mongoose / 5. Modelling Tour Guides Embedding CODE
// tourSchema.pre('save', async function (next) {
//     const guidesPromises = this.guides.map(async id => await User.findById(id)) //this returns all promises 
//     this.guides = await Promise.all(guidesPromises) //here its waiting on all promises at once 
//     next();
// })

//.post executed once all the pre functions are executed 
//tourSchema.post() will have access to document saved to DB along with next()
//here we no more have accesss to this keyword
// tourSchema.post('save', function (doc, next) {
//     console.log(doc)
//     next();
// })

//QUERY MIDDLEWARE #1
// '/^find/' --> regular expression .This will work for all events starting with find eg:findOne etc
tourSchema.pre(/^find/, function (next) {
    this.find({ secretTour: { $ne: true } }) //Filter on find() method
    this.start = Date.now()
    next();
})

//QUERY MIDDLEWARE #2
tourSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'guides',//the field on which to populate from base collection ie users in this tours, from users 
        select: '-_v,-passwordChangedAt' //the field from referencing collection which are to be ignored(coz of '-' sign)
    })

    next();
})

//QUERY MIDDLEWARE #3
tourSchema.post(/^find/, function (docs, next) {
    console.log(`Query took ${Date.now() - this.start} milliseconds`)
    next();
})


//AGGREGATE MIDDLEWARE #1
// tourSchema.pre('aggregate', function (next) {
//     this.pipeline().unshift({ $match: { secretTour: { $ne: true } } }) //adds this match property to aggregate object 
//     console.log(this.pipeline())
//     next();
// })

const Tour = mongoose.model('Tour', tourSchema)

module.exports = Tour
