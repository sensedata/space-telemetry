module.exports = {
  devtool: "#source-map",

  entry: "./client/index.js",

  externals: {
    "crossfilter": "crossfilter",
    "d3": "d3",
    "io": "io",
    "jquery": "jQuery",
    "react": "React"
  },

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