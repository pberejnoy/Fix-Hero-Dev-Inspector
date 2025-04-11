const path = require("path")
const CopyPlugin = require("copy-webpack-plugin")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const { CleanWebpackPlugin } = require("clean-webpack-plugin")
const Dotenv = require("dotenv-webpack")

module.exports = {
  entry: {
    popup: "./src/popup.tsx",
    sidebar: "./src/sidebar.tsx",
    background: "./src/background.ts",
    content: "./src/content.ts",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader", "postcss-loader"],
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        type: "asset/resource",
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  plugins: [
    new CleanWebpackPlugin(),
    new Dotenv({
      systemvars: true, // Load all system environment variables as well
    }),
    new HtmlWebpackPlugin({
      template: "./src/popup.html",
      filename: "popup.html",
      chunks: ["popup"],
    }),
    new HtmlWebpackPlugin({
      template: "./src/sidebar.html",
      filename: "sidebar.html",
      chunks: ["sidebar"],
    }),
    new CopyPlugin({
      patterns: [
        { from: "public", to: "." },
        { from: "src/styles.css", to: "styles.css" },
        { from: "manifest.json", to: "manifest.json" },
      ],
    }),
  ],
}
