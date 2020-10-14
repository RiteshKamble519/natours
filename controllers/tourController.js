const Tour = require('./../models/tourModels')
const catchAsync = require('./../utils/catchAsync')
//const AppError = require('../utils/appError')
const factory = require('./handlerFactory')
const AppError = require('../utils/appError')

//2. ROUTE HANDLERS  
exports.aliasTopTours = (req, res, next) => {
    req.query.limit = '5'
    req.query.sort = '-ratingsAverage'
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty'
    next();
}

exports.checkBody = (req, res, next) => {
    if (!(req.body.price) || !(req.body.name)) {
        return res.status(400).json({
            status: 'fail',
            message: 'Missing name or price'
        })
    }
    next();
}

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' })
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

//catchAsync returns a functions which is stores in getTourStats and it is this funct 
//that express calls when user hits getTourStats .This is done to get rid of try-catch block 
exports.getTourStats = catchAsync(async (req, res, next) => {
    //inside aggregate() is array[] and inside that is stages{}.Each stage is an object 
    //MongoDB code
    //.aggregate() returns a object and thats why we have to await it 
    const stats = await Tour.aggregate([
        {
            $match: { ratingsAverage: { $gte: 4.5 } }
        },
        {
            //Allows to group documents together using accululators
            //_id is used for grouping and compulsory  ,
            $group: {
                _id: '$difficulty', //groups data by this id;if dont wanna use _id then use null; 
                sumTours: { $sum: 1 }, //adds 1 for every new item .ie counts 
                numRatings: { $sum: '$ratingsQuantity' },
                avgRating: { $avg: '$ratingsAverage' }, //way to calculate average -- $avg is operator
                avgPrice: { $avg: '$price' }, //'$price' is the field on which average is applied
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' }
            }
        },
        {
            $sort: { avgPrice: 1 } //sort will work on data passed on by above query 
        }
        // {
        //     $match: { _id: { $ne: 'easy' } } // next stage begins which will be implemented on data passed on by above query   
        // }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            stats
        }
    });
}
)

//This route => /tours-within/400/centre/34.11,-118.11/unit/mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
    const { distance, latlng, unit } = req.params //Using destructuring to extract variable value from URL
    const [lat, lng] = latlng.split(',')

    //Mongo DB expects the distance of radius into radiance .Radiance = Distance / Radius of Earth
    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

    if (!lat || !lng) {
        next(
            new AppError('Please provide latitude and longitude in the format lat,lng.', 400)
        )
    }

    //The Geospatial query
    const tours = await Tour.find({
        //In JSON specify longitude first and then the longitude
        //geoWithin is an operator tht finds documents within a certain geometry
        //That geometry is defined as centreSphere saying start at '[lng, lat]' and search within 'radius' 
        startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
    })

    res.status(200).json({
        status: "success",
        results: tours.length,
        data: {
            data: tours
        }
    })
})

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
    const year = req.params.year * 1

    const plan = await Tour.aggregate([
        { $unwind: '$startDates' },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group: {
                _id: { $month: '$startDates' }, //$month extracts month from $startDates 
                numTourStats: { $sum: 1 },
                tours: { $push: '$name' } //pushes $name into array 
            }
        },
        {
            $addFields: { month: '$_id' } //$addFields add a data field to the projection(view) and not to the database 
        },
        {
            $project: {
                _id: 0 //from hereonwards '_id' will not be shown in the projection(view) 
            }
        },
        {
            $sort: {
                numTourStats: -1 //sorts in decending order of numTourStats
            }
        },
        {
            $limit: 12 //limits only 12 documents to o/p
        }

    ])

    res.status(200).json({
        status: 'success',
        data: { plan }
    });
}
)

exports.getDistances = catchAsync(async (req, res, next) => {
    const { latlng, unit } = req.params //Using destructuring to extract variable value from URL
    const [lat, lng] = latlng.split(',')

    if (!lat || !lng) {
        next(
            new AppError('Please provide latitude and longitude in the format lat,lng.', 400)
        )
    }

    const multipler = unit === 'mi' ? 0.000621371 : 0.001

    //For geospatial queries in Mongo there is only 1 operator 'geoNear' for aggregation
    const distances = await Tour.aggregate([
        {
            //geoNear always needs to be 1st stage in the pipeline 
            //geoNear also requires that atleast 1 of our fields needs to have geoSpatial index
            //If you have multiple fields with geospatial index then we need to use 'Keys' parameter to define field for calculation 
            $geoNear: {
                //near is the point which will be used in calculation with other
                near: {
                    type: 'Point',
                    coordinates: [lng * 1, lat * 1]
                },
                distanceField: 'distance', //Distance with other locations will be stored in this field and be called 'distance'
                distanceMultiplier: multipler //to divide distance by 1000 
            },
        },
        {   //project decides which fields will be seen in output ie here name and distance will be seen in the output along with _id 
            $project: {
                name: 1,
                distance: 1
            }
        }
    ])

    res.status(200).json({
        status: "success",
        data: {
            data: distances
        }
    })
})