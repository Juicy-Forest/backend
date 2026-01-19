import js from '@eslint/js';
import globals from 'globals';

export default [
    js.configs.recommended,
    {
        rules: {
            'no-unused-vars': 'warn',
            'no-console': 'off',
            'semi': ['error', 'always'],
            'no-var': 'error',
            'prefer-const': 'warn',
            'no-duplicate-imports': 'error',
            'eqeqeq': ['error', 'always'],
            'require-await': 'warn',
            'no-await-in-loop': 'warn',
            'indent': ['error', 4],
            'quotes': ['error', 'single'],
            'object-curly-spacing': ['error', 'always'],
            'arrow-spacing': 'error',
            'keyword-spacing': 'error',
            'space-before-blocks': 'error',
            'no-undef': 'error',
        },
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                ...globals.node,
                ...globals.jest
            }
        }
    }
];