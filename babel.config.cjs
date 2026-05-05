module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: {
        browsers: ['>0.2%', 'not dead', 'not op_mini all'],
      },
      modules: false,
    }],
    ['@babel/preset-react', {
      runtime: 'automatic',
    }],
    '@babel/preset-typescript',
  ],
  env: {
    test: {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react', { runtime: 'automatic' }],
        '@babel/preset-typescript',
      ],
    },
  },
};
