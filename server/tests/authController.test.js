const request = require('supertest');
const express = require('express');
const authController = require('../controllers/authController');
const userService = require('../services/userService');

// Mock all exports from userService
jest.mock('../services/userService');

const app = express();
app.use(express.json());

// Mock middleware to simulate a logged-in user for specific tests
app.use((req, res, next) => {
    next();
});

app.use('/auth', authController);

describe('Auth Controller', () => {
    
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /auth/register', () => {
        it('should return 201 and token on successful registration', async () => {
            userService.register.mockResolvedValue({ accessToken: 'mock-token' });

            const response = await request(app)
                .post('/auth/register')
                .send({ username: 'test', email: 'test@test.com', password: 'password123' });

            expect(response.status).toBe(201);
            expect(response.body.accessToken).toBe('mock-token');
            expect(userService.register).toHaveBeenCalledWith('test', 'test@test.com', 'password123');
        });

        it('should return 400 if registration fails', async () => {
            userService.register.mockRejectedValue(new Error('Email is taken'));

            const response = await request(app)
                .post('/auth/register')
                .send({ email: 'taken@test.com' });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Email is taken');
        });
    });

    describe('POST /auth/changeEmail', () => {
        const url = '/auth/changeEmail';

        it('should return 401 if user is not logged in (req.user missing)', async () => {
            const response = await request(app).post(url).send({ newEmail: 'new@test.com' });
            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Not authenticated');
        });

        it('should return 400 for invalid email format', async () => {
            // Re-creating the app instance for this test to inject req.user
            const authenticatedApp = express();
            authenticatedApp.use(express.json());
            authenticatedApp.use((req, res, next) => {
                req.user = { _id: '123', email: 'old@test.com' };
                next();
            });
            authenticatedApp.use('/auth', authController);

            const response = await request(authenticatedApp)
                .post(url)
                .send({ newEmail: 'invalid-email' });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Invalid email format');
        });

        it('should return 200 and call service on valid email change', async () => {
            const authenticatedApp = express();
            authenticatedApp.use(express.json());
            authenticatedApp.use((req, res, next) => {
                req.user = { _id: '123', email: 'old@test.com' };
                next();
            });
            authenticatedApp.use('/auth', authController);

            userService.getUserByEmail.mockResolvedValue(null); // No one else has this email
            userService.updateEmail.mockResolvedValue(true);

            const response = await request(authenticatedApp)
                .post(url)
                .send({ newEmail: 'new@test.com' });

            expect(response.status).toBe(200);
            expect(userService.updateEmail).toHaveBeenCalledWith('123', 'new@test.com');
        });
    });

    describe('GET /auth/logout', () => {
        it('should return 204 and call logout service', async () => {
            const authenticatedApp = express();
            authenticatedApp.use((req, res, next) => {
                req.token = 'active-token';
                next();
            });
            authenticatedApp.use('/auth', authController);

            const response = await request(authenticatedApp).get('/auth/logout');

            expect(response.status).toBe(204);
            expect(userService.logout).toHaveBeenCalledWith('active-token');
        });
    });
});