const fs = require("fs");
const path = require("path");
const webpack = require("webpack");
const CopyPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const cssNano = require("cssnano");
const postcssPresetEnv = require("postcss-preset-env");

const isProduction = process.env.NODE_ENV === "production";
const wpAssetsPath = path.resolve(__dirname, "assets/webpack");
const distPath = path.resolve(__dirname, "dist");

if (!fs.existsSync(wpAssetsPath)) {
  fs.mkdirSync(wpAssetsPath);
}

/**
 * Reads "assets/webpack" directory and returns an object containing
 * JavaScript relative paths as keys and their full paths as
 * values to be used by webpack as entry points
 * e.g.: { "assets/webpack/file-name": "/path/to/file/name/file-name.js" }
 */
const jsFiles = fs.readdirSync(wpAssetsPath);
const entryFiles = jsFiles.reduce(
  (acc, file) => {
    const match = file.match(/(.*)\.js$/);
    if (!match) {
      return acc;
    }

    const fileName = match[1];
    const fullPath = `${wpAssetsPath}/${fileName}.js`;
    return { ...acc, [fileName]: fullPath };
  },
  { application: "./assets/application.js" }
);

const fileNameResolver = (data) => {
  let fileName = "assets/[name].js";
  if (data.chunk.name === "variables") fileName += ".liquid";
  return fileName;
};

const jsRules = {
  test: /\.(js|js.liquid|jsx)$/,
  exclude: /node_modules/,
  use: [
    {
      loader: "babel-loader",
      options: {
        presets: [
          [
            require.resolve("@babel/preset-env"),
            {
              targets: {
                browsers: ["last 2 versions"],
              },
              forceAllTransforms: true,
            },
          ],
          require.resolve("@babel/preset-react"),
        ],
        plugins: [
          // Stage 0
          require.resolve("@babel/plugin-proposal-function-bind"),

          // Stage 1
          require.resolve("@babel/plugin-proposal-export-default-from"),
          require.resolve(
            "@babel/plugin-proposal-logical-assignment-operators"
          ),
          [
            require.resolve("@babel/plugin-proposal-optional-chaining"),
            { loose: false },
          ],
          [
            require.resolve("@babel/plugin-proposal-pipeline-operator"),
            { proposal: "minimal" },
          ],
          [
            require.resolve(
              "@babel/plugin-proposal-nullish-coalescing-operator"
            ),
            { loose: false },
          ],
          require.resolve("@babel/plugin-proposal-do-expressions"),

          // Stage 2
          require.resolve("@babel/plugin-proposal-function-sent"),
          require.resolve("@babel/plugin-proposal-export-namespace-from"),
          require.resolve("@babel/plugin-proposal-numeric-separator"),
          require.resolve("@babel/plugin-proposal-throw-expressions"),

          // Stage 3
          require.resolve("@babel/plugin-syntax-dynamic-import"),
          require.resolve("@babel/plugin-syntax-import-meta"),
          require.resolve("@babel/plugin-proposal-json-strings"),

          // Custom
          require.resolve("@babel/plugin-transform-runtime"),
          require.resolve("babel-plugin-transform-optional-chaining"),
        ],
      },
    },
  ],
};

module.exports = [
  {
    entry: entryFiles,
    output: {
      filename: fileNameResolver,
      path: distPath,
      publicPath: "/",
    },
    externals: {
      jquery: "jQuery",
    },
    module: {
      rules: [
        jsRules,
        {
          test: /\.(css|scss)$/,
          use: [
            {
              loader: isProduction
                ? MiniCssExtractPlugin.loader
                : "style-loader",
            },
            {
              loader: "postcss-loader",
              options: {
                ident: "postcss",
                plugins: [postcssPresetEnv(), cssNano()],
              },
            },
            {
              loader: "sass-loader",
              options: {
                sourceMap: true,
              },
            },
          ],
        },
        {
          test: /\.(ttf|eot|woff|woff2|svg)$/,
          loader: "url-loader?limit=100000",
          options: {
            name: "[name].[ext]",
          },
        },
        {
          test: /\.(png|jpg|gif)$/,
          loader: "url-loader?limit=100000",
        },
      ],
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: "[name].css",
        chunkFilename: "[id].css",
      }),
      new webpack.ProvidePlugin({
        $: "jquery",
        jQuery: "jquery",
      }),
      new CopyPlugin([
        {
          from: "assets",
          to: "assets",
          flatten: true,
          ignore: [...jsFiles],
        },
        { from: "config", to: "config" },
        { from: "layout", to: "layout" },
        { from: "locales", to: "locales" },
        { from: "sections", to: "sections" },
        { from: "snippets", to: "snippets" },
        { from: "templates", to: "templates" },
      ]),
    ],
  },
];
