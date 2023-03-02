module.exports = {
    env: {
        node: true
    },
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        'plugin:jest/recommended'
    ],
    parser: '@typescript-eslint/parser',
    plugins: [
        '@typescript-eslint',
        'jest',
    ],
    root: true,
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: ['./tsconfig.json'],
    },
    rules: {
        "@typescript-eslint/ban-types": "off",
        "@typescript-eslint/explicit-module-boundary-types": "off",
        "@typescript-eslint/no-inferrable-types": "off",
        "@typescript-eslint/no-use-before-define": "off"
    }
};