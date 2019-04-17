module.exports = {
    env: {
        commonjs: true,
        es6: true,
        node: true
    },
    extends: 'prettier',
    globals: {
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly'
    },
    parserOptions: {
        ecmaVersion: 2018
    },
    plugins: ['prettier'],
    rules: {
        indent: ['error', 4, { SwitchCase: 1 }],
        'no-unsafe-finally': 'off',
        'no-console': 'off',
        'prettier/prettier': 'error'
    }
};
