const User = require('./../models/userModel')
const catchAsync = require('./../utils/catchAsync')
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory')

const filterObj = (obj, ...allowedFields) => {
    const newObj = {}

    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) newObj[el] = obj[el]
    })

    return newObj
}


exports.createUsers = (req, res) => {
    res.status(500).json({
        status: 'Error',
        message: 'This route is not yet defined!.Please use /signup instead'
    })
}
exports.getAllUsers = factory.getAll(User)
//Do NOT update password with this !
exports.updateUser = factory.updateOne(User)
exports.deleteUser = factory.deleteOne(User)
exports.getUser = factory.getOne(User)

exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, {
        active: false
    })

    res.status(204).json({
        status: 'success',
        data: null
    });
});

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
}

exports.updateMe = catchAsync(async (req, res, next) => {
    // 1 . Create error if user POSTs password data 
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError('This route is not for password updates.Please use /updatePassword.', 400))
    }


    //2 . Filter out unwanted field names that are not allowed to be updated
    //Use: Filter out only those fields which should be updated so protecting other fields from getting corrupted
    const filteredBody = filterObj(req.body, 'name', 'email')

    //3. Update user document 
    //We cannot use save() as that will ask for other unnecesary fields like passwwordConfirm  
    const updateUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
        new: true,
        runValidators: true
    })

    res.status(200).json({
        status: 'success',
        data: {
            user: updateUser
        }
    })
})