var path    = require('path');
var webpack = require('webpack');

module.exports = {
    entry: [
        './src/Komnt.js'
    ],
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'komnt.js',
        publicPath: '/static/'
  },
    module: {
        loaders: [
            { test: /\.css$/, loader: "style!css" }
        ]
    }
};
