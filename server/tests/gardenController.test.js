const request = require('supertest');
const express = require('express');
const gardenController = require('../controllers/gardenController');

// Mock the services
jest.mock('../services/gardenService', () => ({
  createGarden: jest.fn(),
  getAllGardens: jest.fn(),
  getGardensByUserId: jest.fn(),
  getGardenById: jest.fn(),
  joinGarden: jest.fn(),
  joinGardenByCode: jest.fn(),
  leaveGarden: jest.fn(),
  updateGarden: jest.fn(),
  deleteGarden: jest.fn(),
  removeMember: jest.fn()
}));

jest.mock('../util/parser', () => ({
  parseError: jest.fn()
}));

jest.mock('../services/userService', () => ({
  validateToken: jest.fn()
}));

const {
  createGarden,
  getAllGardens,
  getGardensByUserId,
  getGardenById,
  joinGarden,
  joinGardenByCode
} = require('../services/gardenService');

const { validateToken } = require('../services/userService');

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
app.use('/garden', gardenController);

describe('Garden Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /garden', () => {
    it('should create a garden successfully', async () => {
      const mockUser = {
        _id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        avatarColor: '#FFB3BA'
      };

      const mockGarden = {
        _id: 'garden-id',
        name: 'Test Garden',
        description: 'A test garden',
        location: { address: '123 Test St' },
        owner: 'user-id',
        members: ['user-id'],
        joinCode: 'ABC123',
        grid: [],
        toObject: jest.fn().mockReturnValue({
          _id: 'garden-id',
          name: 'Test Garden',
          description: 'A test garden',
          location: { address: '123 Test St' },
          owner: 'user-id',
          members: ['user-id'],
          joinCode: 'ABC123',
          grid: []
        })
      };

      validateToken.mockReturnValue(mockUser);
      createGarden.mockResolvedValue(mockGarden);

      const response = await request(app)
        .post('/garden')
        .set('x-authorization', 'mock-token')
        .send({
          name: 'Test Garden',
          description: 'A test garden',
          location: '123 Test St'
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockGarden.toObject());
      expect(createGarden).toHaveBeenCalled();
    });

    it('should return 400 if name is missing', async () => {
      const mockUser = {
        _id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        avatarColor: '#FFB3BA'
      };

      validateToken.mockReturnValue(mockUser);

      const response = await request(app)
        .post('/garden')
        .set('x-authorization', 'mock-token')
        .send({
          description: 'A test garden',
          location: '123 Test St'
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: 'Name is required' });
    });

    it('should return 400 if location is missing', async () => {
      const mockUser = {
        _id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        avatarColor: '#FFB3BA'
      };

      validateToken.mockReturnValue(mockUser);

      const response = await request(app)
        .post('/garden')
        .set('x-authorization', 'mock-token')
        .send({
          name: 'Test Garden',
          description: 'A test garden'
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: 'Location is required' });
    });

    it('should return 400 on creation error', async () => {
      const mockUser = {
        _id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        avatarColor: '#FFB3BA'
      };

      validateToken.mockReturnValue(mockUser);
      createGarden.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/garden')
        .set('x-authorization', 'mock-token')
        .send({
          name: 'Test Garden',
          description: 'A test garden',
          location: '123 Test St'
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: 'Database error' });
    });
  });

  describe('POST /garden/:id/join', () => {
    it('should join a garden successfully', async () => {
      const mockUser = {
        _id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        avatarColor: '#FFB3BA'
      };

      const mockGarden = {
        _id: 'garden-id',
        name: 'Test Garden',
        members: ['user-id'],
        toObject: jest.fn().mockReturnValue({
          _id: 'garden-id',
          name: 'Test Garden',
          members: ['user-id']
        })
      };

      validateToken.mockReturnValue(mockUser);
      joinGarden.mockResolvedValue(mockGarden);

      const response = await request(app)
        .post('/garden/garden-id/join')
        .set('x-authorization', 'mock-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockGarden.toObject());
      expect(joinGarden).toHaveBeenCalledWith('garden-id', 'user-id');
    });

    it('should return 404 if garden not found', async () => {
      const mockUser = {
        _id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        avatarColor: '#FFB3BA'
      };

      validateToken.mockReturnValue(mockUser);
      joinGarden.mockRejectedValue(new Error('Garden not found'));

      const response = await request(app)
        .post('/garden/invalid-id/join')
        .set('x-authorization', 'mock-token');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Garden not found' });
    });
  });

  describe('POST /garden/join', () => {
    it('should join a garden by code successfully', async () => {
      const mockUser = {
        _id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        avatarColor: '#FFB3BA'
      };

      const mockGarden = {
        _id: 'garden-id',
        name: 'Test Garden',
        members: ['user-id'],
        toObject: jest.fn().mockReturnValue({
          _id: 'garden-id',
          name: 'Test Garden',
          members: ['user-id']
        })
      };

      validateToken.mockReturnValue(mockUser);
      joinGardenByCode.mockResolvedValue(mockGarden);

      const response = await request(app)
        .post('/garden/join')
        .set('x-authorization', 'mock-token')
        .send({ joinCode: 'ABC123' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockGarden.toObject());
      expect(joinGardenByCode).toHaveBeenCalledWith('ABC123', 'user-id');
    });

    it('should return 400 if join code is missing', async () => {
      const mockUser = {
        _id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        avatarColor: '#FFB3BA'
      };

      validateToken.mockReturnValue(mockUser);

      const response = await request(app)
        .post('/garden/join')
        .set('x-authorization', 'mock-token')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: 'Join code is required' });
    });

    it('should return 404 for invalid join code', async () => {
      const mockUser = {
        _id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        avatarColor: '#FFB3BA'
      };

      validateToken.mockReturnValue(mockUser);
      joinGardenByCode.mockRejectedValue(new Error('Invalid join code'));

      const response = await request(app)
        .post('/garden/join')
        .set('x-authorization', 'mock-token')
        .send({ joinCode: 'INVALID' });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Invalid join code' });
    });
  });
});