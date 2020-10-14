const { promisify } = require('util')
const crypto = require('crypto')
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync')
const jwt = require('jsonwebtoken')
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');
const { doesNotMatch } = require('assert');

const signToken = id => {
    return jwt.sign({ id: id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN  //After this period the JWT key exprires and new key will have to be used
    });
}

const createSendToken = (user, statusCode, res) => {
    //In Mongo id is called _id , hence the newUser_id
    const token = signToken(user._id)
    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),//converting 90 days to milliseconds,
        httpOnly: true //Cookie can in no way be accessed by the browser or modified, it can only be used via network  
    }
    if (process.env.NODE_ENV === 'production') {//Coz we are not using https in postman
        cookieOptions.secure = true //Says cookie will only be send on a secure connection ie https
    }
    res.cookie('jwt', token, cookieOptions)

    //Just removing the password from output at the same time saving it in DB
    user.password = undefined

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
}

exports.signup = catchAsync(async (req, res, next) => {

    //This returns a promise so we are awaiting on it
    const newUser = await User.create(req.body);//We call the create method on the model and then pass obj with which data should be created


    //This Authentication will work only right after user is created and no where else  ie the Signing module


    createSendToken(newUser, 201, res)

})

exports.login = catchAsync(async (req, res, next) => {
    //Reading Email and password from the body
    const { email, password } = req.body //ES6 syntax Destructuring  
    //Normal syntax --> const email = req.body.email

    // 1.Check if email ,password exist
    if (!email || !password) {
        return next(new AppError('Please provide email and password!', 400))
    }

    // 2. Check if user exist and password is correct
    const user = await User.findOne({ email }).select('+password')//Use '+' when you want to select field from DB which is not already selected
    console.log(user)
    //Instance method is available across all the documents

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401))//401 Unauthorized
    }

    //3. If everything is okl send token to client
    createSendToken(user, 200, res)
})

exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedout', { //'loggedout' is just a random text ; jwt is name of cookie
        expires: new Date(Date.now() + 10 * 1000), //expiry 10 sec
        httpOnly: true
    });

    res.status(200).json({
        status: 'success'
    })
}

exports.protect = catchAsync(async (req, res, next) => {
    // 1. Get token and check if it exist
    let token;
    if ((req.headers.authorization) && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    else if (req.cookies.jwt) {
        token = req.cookies.jwt //When accessing from WebUI
    }

    if (!token) {
        return next(new AppError('You are not logged in! Please log in to get access', 401)) //401 Unauthorised
    }

    // 2. Verification of JWT token
    const decoded = await (promisify(jwt.verify)(token, process.env.JWT_SECRET))

    // 3. Check if user wanting to access the route still exist 
    //Cases under which these cases will be evaluated
    //1. User is deleted after token is assigned
    //2. User changed password after token is issued
    //3. etc

    //Check if user exist
    const currentUser = await User.findById(decoded.id)

    if (!currentUser) {
        return next(new AppError('The user belonging to this token does no longer exist', 401))
    }

    //console.log("currentUser : ", currentUser)

    // 4. Check is user changed password after JWT token was issued
    //To protect against if the user changed password after token was issued and if someone is using the token with previous password

    if (currentUser.changePasswordAfter(decoded.iat)) {
        return next(new AppError('User recently changed password .Please log in again', 401))
    }



    //Grant access to protected route
    req.user = currentUser;
    res.locals.user = currentUser
    next()
})

//This is only for rendered pages so it'll have no errors
exports.isLoggedIn = catchAsync(async (req, res, next) => {
    if (req.cookies.jwt) {
        try {//1. Verify token
            const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET)

            //2 . Check if user still exist
            const currentUser = await User.findById(decoded.id)
            if (!currentUser) {
                return next()
            }

            // 3. Check is user changed password after JWT token was issued
            //To protect against if the user changed password after token was issued and if someone is using the token with previous password

            if (currentUser.changePasswordAfter(decoded.iat)) {
                return next()
            }

            //4. If all the above steps are passed it means 'There is a logged in User'
            // PUG template has access to all the variables in res.local . So putting user(variable) in res.local so pug will have access to it 
            res.locals.user = currentUser;
            return next()
        } catch (err) {
            return next()
        }
    }
    //If there is no cookie there is no logged in user so move to next middleware
    next()
})


//Usually we cannot send arguments to middleware function so here we are using clousure 
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        //roles['admin', 'lead-guide']
        //Since in protect function freshUser is saved to req.user we have access to user in req only
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403))//403 : Access forbiden 
        }
        next()
    }
}

exports.forgotPassword = catchAsync(async (req, res, next) => {
    //1.Get user based on POSTed email
    const user = await User.findOne({ email: req.body.email })
    if (!user) {
        return next(new AppError('There is no user with email address', 404))
    }

    //2. Generate a random token 
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false })//validator deactivates all the validators in model .Also saving the data 

    //3.Send it to user's email
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/reserPassword/${resetToken}`
    const message = `Forgot your password? Submit a PATCH request with new password and passwordConfirm to : ${resetURL}.\nIf you didn't forget your password ,please ignore this`

    try {
        await sendEmail({
            email: user.email,
            subject: 'Your password reset token (valid for 10 mins)',
            message
        });

        res.status(200).json({
            status: 'success',
            message: 'Token send to email'
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false })

        return next(new AppError('There was an error sending the email.Try again later', 500))

    }

})

exports.resetPassword = catchAsync(async (req, res, next) => {
    //1. Get User based on the token and check if token has not expired 
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex')
    const user = await User.findOne(//Getting User based on the token 
        {
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }//checking if token has not expired 
        }
    )
    //2. Check user is valid
    if (!user) {
        return next(new AppError('Token is invalid or has expired!', 400))
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined //since passwordResetToken is now used we are deleting it fro db 
    user.passwordResetExpires = undefined

    await user.save()//Now we want the validators to work so we are not turning them off
    //3. Update changePasswordAt property for the user


    //4. Log the user in ,send JWT
    createSendToken(user, 200, res)
})

exports.updatePassword = catchAsync(async (req, res, next) => {
    // 1 . Get User from collection

    //Since this option is available to authenticated users ,so we have already have current users on our req object   
    const user = await User.findById(req.user.id).select('+password') //we have to include password as it is not available by default 
    //We cannot use findByIdAndUpdate here as it will not implement any validations

    // 2 . Check if POSTed current password is correct

    //Using instance method to verify password 
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError('Your current password is wrong', 401))
    }

    // 3 . If so ,update password 
    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save() // We want validation to happen so not turning it off 

    // 4 . Log user in, send JWT
    createSendToken(user, 200, res)

})