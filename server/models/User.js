//TEMPLATE FOR USER
const {Schema, Type , model} = require('mongoose');

const userSchema = new Schema({
    username: {
        required: true,
        type: String,
        minlength: [4, 'Username should have at least 4 characters long'],
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    hashedPassword: {
        type: String,
        required: true,
    },
    failedLoginAttempts: {
        type: Number,
        default: 0,
    },
    lockedUntil: {
        type: Date,
    }
});


userSchema.index({email: 1}, {
    collation: {
        locale: 'en',
        strength: 2
    }
});

const User = model('User', userSchema);

module.exports = User;
