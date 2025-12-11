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
    const user = await User.findOne({ email }).collation({ locale: 'en', strength: 2 })
    if (!user) {
        throw new Error('Incorrect email or password');
    }

    const match = await bcrypt.compare(password, user.hashedPassword);
    if (!match) {
        throw new Error('Incorrect email or password');
    }

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
    getUserByUsername
}