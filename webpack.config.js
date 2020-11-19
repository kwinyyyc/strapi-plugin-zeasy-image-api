/* eslint-disable */

const path = require('path');

const main = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'index.js',
    libraryTarget: 'commonjs2',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        include: path.resolve('./'),
        exclude: /(node_modules|bower_components|build)/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.svg$/,
        use: ['svg-loader'],
      },
      {
        test: /\.(eot|woff|woff2|ttf)([\?]?.*)$/,
        use: ['file-loader'],
      },
      {
        test: /\.(gif|png|jpg)(\?.*$|$)/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8192,
              name: '[name].[ext]',
              publicPath: 'images/',
            },
          },
        ],
      },
      {
        test: /\.css$/i,
        use: ['file-loader', 'css-loader'],
      },
    ],
  },
  externals: {
    react: 'react',
    'react-dom': 'react-dom',
    'styled-components': 'styled-components',
  },
};

const others = {
  entry: './config/functions/pre-bootstrap.js',
  output: {
    path: path.resolve(__dirname, 'config/functions'),
    filename: 'bootstrap.js',
    libraryTarget: 'commonjs2',
  },
  module: {
    rules: [
      {
        test: /\.(gif|png|jpg)(\?.*$|$)/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8192,
              name: '[name].[ext]',
              publicPath: 'images/',
            },
          },
        ],
      },
    ],
  },
};

module.exports = [main, others];
