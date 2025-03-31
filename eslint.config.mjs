import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default [
    eslint.configs.recommended,
    {
        ignores: ['node_modules/**', 'dist/**']
    },
    {
        files: ['**/*.{ts,js}'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 2020,
                sourceType: 'module'
            },
            globals: {
                ...globals.browser,
                ...globals.node
            }
        },
        plugins: {
            '@typescript-eslint': tseslint,
            prettier: prettierPlugin
        },
        rules: {
            'prettier/prettier': 'error',
            '@typescript-eslint/explicit-function-return-type': 'warn',
            '@typescript-eslint/no-explicit-any': 'warn',
            // Turn off standard rule and use typescript-eslint version
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': ['warn', {
                'varsIgnorePattern': '^_',
                'ignoreRestSiblings': true
            }]
        }
    },
    prettierConfig
];