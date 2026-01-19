module.exports = {
    testEnvironment: 'node',
    moduleFileExtensions: ['js'],
    testMatch: ['**/tests/**/*.test.js'],
    collectCoverageFrom: [
        'controllers/**/*.js',
        'services/**/*.js',
        '!**/node_modules/**',
        'util/**/*.js',
        'middlewares/**/*.js'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    verbose: true,
    testTimeout: 10000
};
