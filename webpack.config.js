module.exports = {
  devtool: "#source-map",

  entry: "./client/page.js",

  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: "babel-loader?optional=runtime"
      },
      {
        test: /\.scss$/,
        loader: "style!css!sass"
      },
      {
        test: /\.(eot|png|svg|ttf|woff2?)$/,
        loader: "url-loader?limit=100000"
      }
    ]
  },

  output: {
    path: "./public",
    filename: "index.js"
  }
};
