const crypto = require('crypto')
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs')


const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            require: [true, 'Please tell us your name!']
        },
        email: {
            type: String,
            require: [true, 'Please provide your email!'],
            unique: true,
            lowercase: true,
            validate: [validator.isEmail, 'Please provide a valid email']
        },
        photo: {
            type: String
        },
        role: {
            type: String,
            enum: ['user', 'guide', 'lead-guide', 'admin'],
            default: 'user'
        },
        password: {
            type: String,
            require: [true, 'Please provide a password'],
            minlength: 8,
            select: false //So password will never show in any output or be accesible by other objects
        },
        passwordConfirm: {
            type: String,
            require: [true, 'Please confirm your password'],
            validate: {

                //This works only on CREATE and SAVE operation that means options like findOneandUpdate will not include this validator  
                validator: function (el) {
                    return el === this.password //el refers to passwordConfirm .So if passwordConfirm = password send true
                },
                message: 'Passwords are not the same!'
            }
        },
        passwordChangedAt: Date, //this field is checked with timestamp of JWT token 
        passwordResetToken: String,
        passwordResetExpires: Date,
        active: {
            type: Boolean,
            default: true,
            select: false //So password will never show in any output or be accesible by other objects
        }

    }
)

//This will run between DB reveives data and it is persisted(saved) in DB
userSchema.pre('save', async function (next) {
    //Encrypt the password only if password is newly created/updated

    //If password is not modified then just return 
    if (!this.isModified('password')) return next();

    //cost of operation parameter by default is 10 we are keeping 12 for more complexity  
    this.password = await bcrypt.hash(this.password, 12)

    //We do not want this field once validation is done ,Hence setting it to undefined
    this.passwordConfirm = undefined
    next();
})

userSchema.pre('save', function () {
    if (!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000; //Done 2 account 4 time difference betwn JWT token creation and this.Not perfect but works
    next();
})

userSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });

    next();
})

//Instance method => available across all documents of a Model
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword)
}

//Instance method
userSchema.methods.changePasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10)
        return JWTTimestamp < changedTimeStamp
    }

    return false
}

userSchema.methods.createPasswordResetToken = function () {
    //This should be a random string not necessarily as cryptographically strong as the password created above
    const resetToken = crypto.randomBytes(32).toString('hex') //User will use this resetToken to reset password

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex') // Save this in DB since its encrypted
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    console.log({ resetToken }, this.passwordResetToken)
    return resetToken;//Send this token over email
}




const User = mongoose.model('User', userSchema)

module.exports = User; 
