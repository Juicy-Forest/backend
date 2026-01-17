const userService = require('../services/userService');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Mock dependencies
jest.mock('../models/User');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('User Service', () => {
    
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('register', () => {
        it('should register a new user and return a token object', async () => {
            const userData = { username: 'testuser', email: 'test@test.com', password: 'password123' };
            const mockUser = { 
                _id: '123', 
                ...userData, 
                hashedPassword: 'hashed_password',
                avatarColor: '#BAE1FF' 
            };

            // Mocking the chain: User.findOne().collation()
            User.findOne.mockReturnValue({
                collation: jest.fn().mockResolvedValue(null) // First call (email), second call (username)
            });
            bcrypt.hash.mockResolvedValue('hashed_password');
            User.create.mockResolvedValue(mockUser);
            jwt.sign.mockReturnValue('mock_token');

            const result = await userService.register(userData.username, userData.email, userData.password);

            expect(User.create).toHaveBeenCalled();
            expect(result.accessToken).toBe('mock_token');
            expect(result.username).toBe('testuser');
        });

        it('should throw an error if email is already taken', async () => {
            User.findOne.mockReturnValue({
                collation: jest.fn().mockResolvedValue({ email: 'exists@test.com' })
            });

            await expect(userService.register('user', 'exists@test.com', 'pass'))
                .rejects.toThrow('Email is taken');
        });
    });

    describe('login', () => {
        it('should login successfully with correct credentials', async () => {
            const mockUser = { 
                _id: '123', 
                email: 'test@test.com', 
                hashedPassword: 'hashed',
                lockedUntil: null 
            };

            User.findOne.mockReturnValue({
                collation: jest.fn().mockResolvedValue(mockUser)
            });
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('login_token');

            const result = await userService.login('test@test.com', 'password');

            expect(result.accessToken).toBe('login_token');
        });

        it('should throw error if account is locked', async () => {
            const lockedUser = { 
                lockedUntil: Date.now() + 10000 // Locked for 10 seconds 
            };

            User.findOne.mockReturnValue({
                collation: jest.fn().mockResolvedValue(lockedUser)
            });

            await expect(userService.login('test@test.com', 'pass'))
                .rejects.toThrow('Account is locked. Try again later.');
        });

        it('should throw error on incorrect password', async () => {
            User.findOne.mockReturnValue({
                collation: jest.fn().mockResolvedValue({ hashedPassword: 'hashed' })
            });
            bcrypt.compare.mockResolvedValue(false);

            await expect(userService.login('test@test.com', 'wrong_pass'))
                .rejects.toThrow('Incorrect email or password');
        });
    });

    describe('updateUsername', () => {
        it('should update the username and return a new token', async () => {
            const userId = '123';
            const newUsername = 'new_name';
            const mockUser = { 
                _id: userId, 
                username: 'old_name', 
                save: jest.fn().mockResolvedValue(true) 
            };

            User.findById.mockResolvedValue(mockUser);
            jwt.sign.mockReturnValue('new_token');

            const result = await userService.updateUsername(userId, newUsername);

            expect(mockUser.username).toBe(newUsername);
            expect(mockUser.save).toHaveBeenCalled();
            expect(result.accessToken).toBe('new_token');
        });
    });

    describe('validateToken', () => {
        it('should return data if token is valid', () => {
            const mockData = { _id: '123', username: 'test' };
            jwt.verify.mockReturnValue(mockData);

            const result = userService.validateToken('valid_token');
            expect(result).toEqual(mockData);
        });

        it('should throw error if token is invalid', () => {
            jwt.verify.mockImplementation(() => { throw new Error(); });

            expect(() => userService.validateToken('bad_token'))
                .toThrow('Invalid access token!');
        });
    });
});