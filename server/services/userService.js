const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const webConstants = require('../web-constants');


const tokenBlacklist = new Set();

const validateToken = (token) => {
    try {
        const data = jwt.verify(token, webConstants['JWT-SECRET']);
        return data;
    } catch (error) {
        throw new Error('Invalid access token!');
    }
};

async function register(username, email, password) {
    const existing = await User.findOne({ email }).collation({ locale: 'en', strength: 2 });
    if (existing) {
        throw new Error('Email is taken');
    }

    const existingUsername = await User.findOne({ username }).collation({ locale: 'en', strength: 2 });
    if (existingUsername) {
        throw new Error('Username is taken');
    }

    const user = await User.create({
        username,
        email,
        hashedPassword: await bcrypt.hash(password, 10),
        avatarColor: getRandomPastelColor(),
    });

    return createToken(user);

}

async function login(email, password) {
    const user = await User.findOne({ email }).collation({ locale: 'en', strength: 2 });
    if (!user) {
        throw new Error('Incorrect email or password');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > Date.now()) {
        throw new Error('Account is locked. Try again later.');
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

async function updateUser(id, data) {
    const user = await User.findById(id);
    if (!user) {
        throw new Error('User not found');
    }

    if (data.firstName) {
        user.firstName = data.firstName;
    }

    if (data.lastName) {
        user.lastName = data.lastName;
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

function getRandomPastelColor() {
    const pastelColors = [
        '#FFB3BA', // light pink
        '#FFDFBA', // light orange
        '#FFFFBA', // light yellow
        '#BAFFC9', // light green
        '#BAE1FF', // light blue
        '#D5BAFF', // light purple
        '#FFC9DE', // soft pink
        '#FFE7BA', // peach
        '#BAFFD9', // mint
        '#BFFFD9'  // soft turquoise
    ];

    const randomIndex = Math.floor(Math.random() * pastelColors.length);
    return pastelColors[randomIndex];
}

async function getUserByEmail(email) {
    return await User.findOne({ email }).collation({ locale: 'en', strength: 2 });
}

async function updateUserPassword(userId, newPassword) {

    const user = await getUserById(userId);

    if (!user) {
        throw new Error('User not found');
    }

    user.hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.save();
}

async function updateEmail(userId, newEmail) {
    const user = await getUserById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    user.email = newEmail;
    await user.save();
}

async function updateUsername(userId, newUsername) {
    const user = await getUserById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    user.username = newUsername;
    await user.save();
    return createToken(user);
}

function createToken(user) {
    const payload = {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatarColor: user.avatarColor,
    };

    return {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatarColor: user.avatarColor,
        accessToken: jwt.sign(payload, webConstants['JWT-SECRET'])
    };
}

module.exports = {
    register,
    login,
    logout,
    validateToken,
    getUserById,
    getUserByUsername,
    getUserByEmail,
    updateUserPassword,
    updateEmail,
    updateUsername
};
