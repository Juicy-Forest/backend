const request = require('supertest');
const express = require('express');
const authController = require('../controllers/authController');

// Mock the services
jest.mock('../services/userService', () => ({
  register: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  getUserById: jest.fn(),
  getUserByUsername: jest.fn(),
  getUserByEmail: jest.fn(),
  updateUserPassword: jest.fn(),
  updateEmail: jest.fn(),
  updateUsername: jest.fn(),
  validateToken: jest.fn()
}));

jest.mock('../util/parser', () => ({
  parseError: jest.fn()
}));

const { register, login, logout, getUserById, validateToken } = require('../services/userService');

// Mock auth middleware
const mockAuthMiddleware = jest.fn((req, res, next) => {
  const token = req.headers['x-authorization'];
  if (token) {
    try {
      const user = validateToken(token);
      req.user = {
        'email': user.email,
        'username': user.username,
        '_id': user._id,
        'avatarColor': user.avatarColor
      };
      req.token = token;
    } catch (error) {
      // Do nothing for test
    }
  }
  next();
});

const app = express();
app.use(express.json());
app.use(mockAuthMiddleware);
app.use('/auth', authController);

describe('Auth Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('should register a user successfully', async () => {
      const mockToken = {
        accessToken: 'mock-token',
        _id: 'user-id',
        username: 'testuser',
        email: 'test@example.com'
      };

      register.mockResolvedValue(mockToken);

      const response = await request(app)
        .post('/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        accessToken: 'mock-token',
        message: 'user logged in.'
      });
      expect(register).toHaveBeenCalledWith('testuser', 'test@example.com', 'password123');
    });

    it('should return 400 on registration error', async () => {
      register.mockRejectedValue(new Error('Email is taken'));

      const response = await request(app)
        .post('/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Email is taken' });
    });
  });

  describe('POST /auth/login', () => {
    it('should login a user successfully', async () => {
      const mockToken = {
        accessToken: 'mock-token',
        _id: 'user-id',
        username: 'testuser',
        email: 'test@example.com'
      };

      login.mockResolvedValue(mockToken);

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        accessToken: 'mock-token',
        message: 'user logged in.'
      });
      expect(login).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    it('should return 400 on login error', async () => {
      login.mockRejectedValue(new Error('Incorrect email or password'));

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Incorrect email or password' });
    });
  });

  describe('GET /auth/logout', () => {
    it('should logout a user successfully', async () => {
      const mockUser = {
        _id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        avatarColor: '#FFB3BA'
      };

      validateToken.mockReturnValue(mockUser);
      logout.mockResolvedValue();

      const response = await request(app)
        .get('/auth/logout')
        .set('x-authorization', 'mock-token');

      expect(response.status).toBe(204);
      expect(logout).toHaveBeenCalledWith('mock-token');
    });
  });

  describe('GET /auth/', () => {
    it('should return user data when authenticated', async () => {
      const mockUser = {
        _id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        avatarColor: '#FFB3BA'
      };

      validateToken.mockReturnValue(mockUser);
      getUserById.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/auth/')
        .set('x-authorization', 'mock-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUser);
      expect(getUserById).toHaveBeenCalledWith('user-id');
    });
  });
});
