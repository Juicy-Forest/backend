const trimMiddleware = require('../middlewares/trimBody');

describe('Trim Middleware', () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
        // Mocking the Express objects
        req = {
            body: {}
        };
        res = {};
        next = jest.fn(); // Mock next function
    });

    it('should trim whitespace from string values in req.body', () => {
        req.body = {
            username: '  johndoe  ',
            email: ' test@example.com ',
            bio: 'Keep this space '
        };

        const middleware = trimMiddleware();
        middleware(req, res, next);

        expect(req.body.username).toBe('johndoe');
        expect(req.body.email).toBe('test@example.com');
        expect(req.body.bio).toBe('Keep this space');
    });

    it('should not modify non-string values', () => {
        req.body = {
            age: 25,
            isAdmin: false,
            scores: [10, 20]
        };

        const middleware = trimMiddleware();
        middleware(req, res, next);

        expect(req.body.age).toBe(25);
        expect(req.body.isAdmin).toBe(false);
        expect(req.body.scores).toEqual([10, 20]);
    });

    it('should call next() exactly once', () => {
        req.body = { name: '  Alice  ' };

        const middleware = trimMiddleware();
        middleware(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
    });

    it('should handle an empty body without throwing errors', () => {
        req.body = {};

        const middleware = trimMiddleware();
        
        expect(() => {
            middleware(req, res, next);
        }).not.toThrow();
        
        expect(next).toHaveBeenCalled();
    });
});