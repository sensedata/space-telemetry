module.exports = {
  devtool: "#source-map",

  entry: "./client/index.js",

  module: {
    loaders: [{
      test: /\.jsx?$/,
      exclude: /node_modules/,
      loader: "babel-loader?optional=runtime"
    }]
  },

  output: {
    path: "./public",
    filename: "index.js"
  }
};
