const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require("../models/User");
const webConstants = require('../web-constants');


const tokenBlacklist = new Set();

const validateToken = (token) => {
    try {
        const data = jwt.verify(token, webConstants['JWT-SECRET'])
        return data
    } catch (error) {
        throw new Error('Invalid access token!')
    }
}

async function register(username, email, password) {
    const existing = await User.findOne({ email }).collation({ locale: 'en', strength: 2 })
    if (existing) {
        throw new Error('Email is taken');
    }

    const existingUsername = await User.findOne({ username }).collation({ locale: 'en', strength: 2 })
    if (existingUsername) {
        throw new Error('Username is taken');
    }

    
    const user = await User.create({
        username,
        email,
        hashedPassword: await bcrypt.hash(password, 10),
    })

    return createToken(user);

}

async function login(email, password) {
    const user = await User.findOne({ email })
    if (!user) {
        throw new Error('Incorrect email or password');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > Date.now()) {
        throw new Error('Account is locked. Try again later.');
    }

    const match = await bcrypt.compare(password, user.hashedPassword);
    if (!match) {
        user.failedLoginAttempts += 1;
        if (user.failedLoginAttempts >= 5) {
            user.lockedUntil = Date.now() + 60 * 60 * 1000; // Lock for 1 hour
        }
        await user.save();
        throw new Error('Incorrect email or password');
    }

    // Reset on successful login
    user.failedLoginAttempts = 0;
    user.lockedUntil = undefined;
    await user.save();

    return createToken(user);
}

async function logout(token) {
    tokenBlacklist.add(token);
}

async function getUserById(id) {
    return await User.findById(id);
}

async function getUserByUsername(username) {
    return await User.findOne({ username: username });
}

async function updateUser(id, data) {
    const user = await User.findById(id);
    if (!user) {
        throw new Error('User not found');
    }

    if (data.username) {
        user.username = data.username;
    }

    if (data.email) {
        const existingEmail = await User.findOne({ email: data.email });
        if (existingEmail && existingEmail._id.toString() !== id) {
            throw new Error('Email is taken');
        }
        user.email = data.email;
    }

    if (data.password) {
        user.hashedPassword = await bcrypt.hash(data.password, 10);
    }

    await user.save();
    return user;
}

async function deleteUser(id) {
    const user = await User.findById(id);
    if (!user) {
        throw new Error('User not found');
    }
    await User.findByIdAndDelete(id);
}

function createToken(user) {
    const payload = {
        _id: user._id,
        username: user.username,
        email: user.email,
    }

    return {
        _id: user._id,
        username: user.username,
        email: user.email,
        accessToken: jwt.sign(payload, webConstants['JWT-SECRET'])
    }
}



module.exports = {
    register,
    login,
    logout,
    validateToken,
    getUserById,
    getUserByUsername,
    updateUser,
    deleteUser
}
