const authController = require('express').Router();
const { body, validationResult } = require('express-validator');
const { getByUserId } = require('../services/userService');

const { register, login, logout, getUserByUsername, getUserByEmail,getUserById, updateUserPassword,updateEmail,updateUsername } = require('../services/userService');
const { parseError } = require('../util/parser');


//HOME PAGE

authController.get('/', async (req, res) => {
    const user = req.user;
    if (user) {
        const freshUser = await getUserById(user._id);
        res.status(200).json(freshUser)
    }
})
//REGISTER LOGIC

authController.post('/register',
    async (req, res) => {
        try {
            const token = await register(req.body.username, req.body.email, req.body.password);
            res.status(201).json({accessToken: token.accessToken, message: "user logged in."});
        } catch (error) {
            console.log(error);
            res.status(400).json({error:error.message})
        }
    })

//LOGIN LOGIC

authController.post('/login', async (req, res) => {
    try {
        const token = await login(req.body.email, req.body.password);
        res.status(201).json({accessToken: token.accessToken, message: "user logged in."});
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

//LOGOUT LOGIC

authController.get('/logout', async (req, res) => {
    const token = req.token;
    await logout(token);
    res.status(204).end();
})

//CHANGE PASSWORD LOGIC
authController.post('/changePassword', async (req, res) => {
    try {
        const user = req.user;

        if (!user) {
            return res.status(401).json({ error: "Not authenticated" });
        }

        const { newPassword } = req.body;

        if (!newPassword || newPassword.trim().length === 0) {
            return res.status(400).json({ error: "New password is required" });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ error: "Password must be at least 8 characters long" });
        }

        await updateUserPassword(user._id, newPassword);
        
        res.status(200).json({ message: "Password changed successfully!" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message || "Password change failed" });
    }
})

authController.post('/changeUsername', async (req, res) => {
    try {
        const user = req.user;

        if (!user) {
            return res.status(401).json({ error: "Not authenticated" });
        }

        const { newUsername } = req.body;

        if (!newUsername || newUsername.trim().length === 0) {
            return res.status(400).json({ error: "New username is required" });
        }

        await updateUsername(user._id, newUsername);
        
        res.status(200).json({ message: "Username changed successfully!" });    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message || "Username change failed" });
    }
})

authController.post('/changeEmail', async (req, res) => {
    try {
        const user = req.user;

        if (!user) {
            return res.status(401).json({ error: "Not authenticated" });
        }

        const { newEmail } = req.body;

        if (!newEmail || newEmail.trim().length === 0) {
            return res.status(400).json({ error: "New email is required" });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newEmail)) {
            return res.status(400).json({ error: "Invalid email format" });
        }

        if (newEmail.toLowerCase() === user.email.toLowerCase()) {
            return res.status(400).json({ error: "New email must be different from current email" });
        }

        const existingUser = await getUserByEmail(newEmail);
        if (existingUser) {
            return res.status(400).json({ error: "Email is already in use" });
        }

        await updateEmail(user._id, newEmail);
        
        res.status(200).json({ message: "Email changed successfully!", newEmail });    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message || "Email change failed" });
    }
})


module.exports = authController;
