const authController = require('express').Router();
const { body, validationResult } = require('express-validator');
const { getByUserId } = require('../services/userService');

const { register, login, logout, getUserByUsername } = require('../services/userService');
const { parseError } = require('../util/parser');


//HOME PAGE

authController.get('/', async (req, res) => {
    const user = req.user;
    if (user) {
        res.status(200).json(user)
    }
})

//REGISTER LOGIC

authController.post('/register',
    async (req, res) => {
        try {
            const token = await register(req.body.username, req.body.email, req.body.password);
            res.status(201).json(token);
        } catch (error) {
            console.log(error);
            res.status(400).json({error:error.message})
        }
        res.end();
    })

//LOGIN LOGIC

authController.post('/login', async (req, res) => {
    try {
        const token = await login(req.body.email, req.body.password);
        res.json(token);
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
    res.end();
})

//LOGOUT LOGIC

authController.get('/logout', async (req, res) => {
    const token = req.token;
    await logout(token);
    res.status(204).end();
})

module.exports = authController;
