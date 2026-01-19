export default {
    testEnvironment: 'node',
    transform: {},
    moduleFileExtensions: ['js', 'mjs'],
    testMatch: ['**/tests/**/*.test.js'],
    collectCoverageFrom: [
        'controllers/**/*.js',
        'services/**/*.js',
        '!**/node_modules/**'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    verbose: true,
    testTimeout: 10000
};

