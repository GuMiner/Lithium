const path = require('path');
module.exports = {
    entry: './js/index.ts',
    output: {
        path: path.resolve(__dirname, 'static'),
        filename: 'main.bundle.js',
      },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: "ts-loader",
        },
        {
            test: /\.s[ac]ss$/i,
            use: [
              // Creates `style` nodes from JS strings
              "style-loader",
              // Translates CSS into CommonJS
              "css-loader",
              // Compiles Sass to CSS
              "sass-loader",
            ],
          },
      ],
    },
    mode: 'development'
  };