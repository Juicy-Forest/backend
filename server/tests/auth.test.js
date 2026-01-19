const { authMiddleware } = require('../middlewares/auth');
const { validateToken } = require('../services/userService');

// Mock the userService
jest.mock('../services/userService');

describe('Auth Middleware', () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
        req = {
            headers: {}
        };
        res = {
            json: jest.fn() // Mock res.json
        };
        next = jest.fn(); // Mock next
        jest.clearAllMocks();
    });

    it('should proceed and do nothing if x-authorization header is missing', () => {
        authMiddleware(req, res, next);

        expect(req.user).toBeUndefined();
        expect(next).toHaveBeenCalled();
    });

    it('should attach user object to req if token is valid', () => {
        const mockToken = 'valid-jwt-token';
        const mockUser = {
            _id: '123',
            email: 'test@test.com',
            username: 'tester',
            avatarColor: '#BAE1FF'
        };

        req.headers['x-authorization'] = mockToken;
        // Mock validateToken to return the user
        validateToken.mockReturnValue(mockUser);

        authMiddleware(req, res, next);

        expect(validateToken).toHaveBeenCalledWith(mockToken);
        expect(req.user).toEqual({
            ...mockUser,
            token: mockToken
        });
        expect(next).toHaveBeenCalled();
    });

    it('should send json error and call next if token validation fails', () => {
        const mockToken = 'invalid-token';
        const mockError = new Error('Invalid access token!');
        
        req.headers['x-authorization'] = mockToken;
        // Mock validateToken to throw an error
        validateToken.mockImplementation(() => {
            throw mockError;
        });

        // Suppress console.log for a clean test output
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        authMiddleware(req, res, next);

        expect(res.json).toHaveBeenCalledWith(mockError);
        expect(next).toHaveBeenCalled();
        
        consoleSpy.mockRestore();
    });
});