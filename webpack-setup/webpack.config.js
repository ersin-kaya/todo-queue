const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  entry: path.resolve(__dirname, "../script.js"),
  output: {
    filename: "bundle.min.js",
    path: path.resolve(__dirname, "../dist"),
  },
  mode: "production",
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
  },
};
