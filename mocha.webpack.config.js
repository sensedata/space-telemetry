// var webpack = require("webpack");

module.exports = {
  devtool: "#source-map",

  entry: "./test/client/views/readouts/test_integer_readout.js",

  // externals: {
  //   "jsdom": "jsdom",
  //   "mocha": "mocha",
  //   "mocha-jsdom": "mocha-jsdom"
  // },

  module: {
    loaders: [{
      test: /\.jsx?$/,
      exclude: /node_modules/,
      loader: "babel-loader?optional=runtime"
    }]
  },

  // plugins: [
  //   new webpack.IgnorePlugin(/jsdom/)
  // ],

  output: {
    path: "./test",
    filename: "test.js"
  }
};
