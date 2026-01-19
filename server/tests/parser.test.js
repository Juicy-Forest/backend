const { parseError } = require('../util/parser'); // Adjust path as needed

describe('parseError Utility', () => {

    it('should parse an array of errors (Express-validator style)', () => {
        const errorArray = [
            { msg: 'Invalid email' },
            { msg: 'Password too short' }
        ];

        const result = parseError(errorArray);

        expect(result).toBe('Invalid email\nPassword too short');
    });

    it('should parse Mongoose ValidationError objects', () => {
        const mongooseError = {
            name: 'ValidationError',
            errors: {
                username: { message: 'Username is required' },
                email: { message: 'Email is invalid' }
            }
        };

        const result = parseError(mongooseError);

        expect(result).toBe('Username is required\nEmail is invalid');
    });

    it('should return the message property for standard Error objects', () => {
        const standardError = new Error('Something went wrong');

        const result = parseError(standardError);

        expect(result).toBe('Something went wrong');
    });

    it('should return the message property for generic objects with a message', () => {
        const customError = { message: 'Custom error message' };

        const result = parseError(customError);

        expect(result).toBe('Custom error message');
    });
});