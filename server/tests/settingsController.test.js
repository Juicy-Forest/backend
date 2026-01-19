const request = require('supertest');
const express = require('express');

// Mock the services
jest.mock('../services/userService', () => ({
    updateUserPassword: jest.fn(),
    updateEmail: jest.fn(),
    updateUsername: jest.fn(),
    getUserByEmail: jest.fn(),
    getUserById: jest.fn()
}));

jest.mock('../util/parser', () => ({
    parseError: jest.fn((err) => err.message)
}));

const authController = require('../controllers/authController');
const userService = require('../services/userService');

function createTestApp() {
    const app = express();
    app.use(express.json());
  
    // Mock auth middleware
    app.use((req, res, next) => {
        req.user = {
            _id: 'user123',
            username: 'testuser',
            email: 'test@example.com',
            avatarColor: '#FFB3BA'
        };
        req.token = 'test-token-123';
        next();
    });
  
    app.use('/auth', authController);
    return app;
}

describe('Auth Controller - Settings', () => {
    let app;

    beforeEach(() => {
        app = createTestApp();
        jest.clearAllMocks();
    });

    describe('POST /auth/changePassword', () => {
        it('should change password successfully', async () => {
            userService.updateUserPassword.mockResolvedValue(true);

            const response = await request(app)
                .post('/auth/changePassword')
                .send({ newPassword: 'NewPassword123' })
                .expect(200);

            expect(response.body).toHaveProperty('message', 'Password changed successfully!');
            expect(userService.updateUserPassword).toHaveBeenCalledWith('user123', 'NewPassword123');
        });

        it('should return 401 if not authenticated', async () => {
            const appNoAuth = express();
            appNoAuth.use(express.json());
            appNoAuth.use((req, res, next) => {
                req.user = null;
                next();
            });
            appNoAuth.use('/auth', authController);

            const response = await request(appNoAuth)
                .post('/auth/changePassword')
                .send({ newPassword: 'NewPassword123' })
                .expect(401);

            expect(response.body).toHaveProperty('error', 'Not authenticated');
        });

        it('should return 400 if password is empty', async () => {
            const response = await request(app)
                .post('/auth/changePassword')
                .send({ newPassword: '' })
                .expect(400);

            expect(response.body).toHaveProperty('error', 'New password is required');
        });

        it('should return 400 if password is less than 8 characters', async () => {
            const response = await request(app)
                .post('/auth/changePassword')
                .send({ newPassword: 'short' })
                .expect(400);

            expect(response.body).toHaveProperty('error', 'Password must be at least 8 characters long');
        });

        it('should handle service errors', async () => {
            userService.updateUserPassword.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .post('/auth/changePassword')
                .send({ newPassword: 'NewPassword123' })
                .expect(500);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('POST /auth/changeUsername', () => {
        it('should change username successfully', async () => {
            userService.updateUsername.mockResolvedValue({
                accessToken: 'new-token-123',
                _id: 'user123',
                username: 'newusername',
                email: 'test@example.com',
                avatarColor: '#FFB3BA'
            });

            const response = await request(app)
                .post('/auth/changeUsername')
                .send({ newUsername: 'newusername' })
                .expect(200);

            expect(response.body).toHaveProperty('message', 'Username changed successfully!');
            expect(response.body).toHaveProperty('accessToken', 'new-token-123');
            expect(userService.updateUsername).toHaveBeenCalledWith('user123', 'newusername');
        });

        it('should return 401 if not authenticated', async () => {
            const appNoAuth = express();
            appNoAuth.use(express.json());
            appNoAuth.use((req, res, next) => {
                req.user = null;
                next();
            });
            appNoAuth.use('/auth', authController);

            const response = await request(appNoAuth)
                .post('/auth/changeUsername')
                .send({ newUsername: 'newusername' });

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error', 'Not authenticated');
        });

        it('should return 400 if username is empty', async () => {
            const response = await request(app)
                .post('/auth/changeUsername')
                .send({ newUsername: '' })
                .expect(400);

            expect(response.body).toHaveProperty('error', 'New username is required');
        });

        it('should handle service errors', async () => {
            userService.updateUsername.mockRejectedValue(new Error('Username already taken'));

            const response = await request(app)
                .post('/auth/changeUsername')
                .send({ newUsername: 'newusername' })
                .expect(500);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('POST /auth/changeEmail', () => {
        it('should change email successfully', async () => {
            userService.getUserByEmail.mockResolvedValue(null);
            userService.updateEmail.mockResolvedValue(true);

            const response = await request(app)
                .post('/auth/changeEmail')
                .send({ newEmail: 'newemail@example.com' })
                .expect(200);

            expect(response.body).toHaveProperty('message', 'Email changed successfully!');
            expect(response.body).toHaveProperty('newEmail', 'newemail@example.com');
            expect(userService.updateEmail).toHaveBeenCalledWith('user123', 'newemail@example.com');
        });

        it('should return 401 if not authenticated', async () => {
            const appNoAuth = express();
            appNoAuth.use(express.json());
            appNoAuth.use((req, res, next) => {
                req.user = null;
                next();
            });
            appNoAuth.use('/auth', authController);

            const response = await request(appNoAuth)
                .post('/auth/changeEmail')
                .send({ newEmail: 'newemail@example.com' });

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error', 'Not authenticated');
        });

        it('should return 400 if email is empty', async () => {
            const response = await request(app)
                .post('/auth/changeEmail')
                .send({ newEmail: '' })
                .expect(400);

            expect(response.body).toHaveProperty('error', 'New email is required');
        });

        it('should return 400 if email format is invalid', async () => {
            const response = await request(app)
                .post('/auth/changeEmail')
                .send({ newEmail: 'invalid-email' })
                .expect(400);

            expect(response.body).toHaveProperty('error', 'Invalid email format');
        });

        it('should return 400 if new email is same as current email', async () => {
            const response = await request(app)
                .post('/auth/changeEmail')
                .send({ newEmail: 'test@example.com' })
                .expect(400);

            expect(response.body).toHaveProperty('error', 'New email must be different from current email');
        });

        it('should be case-insensitive when comparing current email', async () => {
            const response = await request(app)
                .post('/auth/changeEmail')
                .send({ newEmail: 'TEST@EXAMPLE.COM' })
                .expect(400);

            expect(response.body).toHaveProperty('error', 'New email must be different from current email');
        });

        it('should return 400 if email is already in use', async () => {
            userService.getUserByEmail.mockResolvedValue({
                _id: 'otheruser',
                email: 'taken@example.com'
            });

            const response = await request(app)
                .post('/auth/changeEmail')
                .send({ newEmail: 'taken@example.com' })
                .expect(400);

            expect(response.body).toHaveProperty('error', 'Email is already in use');
        });

        it('should handle service errors', async () => {
            userService.getUserByEmail.mockResolvedValue(null);
            userService.updateEmail.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .post('/auth/changeEmail')
                .send({ newEmail: 'newemail@example.com' })
                .expect(500);

            expect(response.body).toHaveProperty('error');
        });
    });
});
