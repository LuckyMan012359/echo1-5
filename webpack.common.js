const path = require('path');

module.exports = {
  entry: {
    app: './js/script.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    filename: './js/script.js',
  },
};
