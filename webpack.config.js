const path = require('path');
const webpack = require('webpack');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const TerserPlugin = require('terser-webpack-plugin');

// Feature flags PracticaYoruba — controlan si el backend es real o mock
const defaultFlags = {
  PY_CATALOG_SOURCE: 'mock',
  PY_AUTH_SOURCE: 'mock',
  PY_CART_SOURCE: 'mock',
  PY_PAYMENTS_SOURCE: 'mock',
};

// Lee .env.{NODE_ENV} y .env en ese orden
const envFiles = [
  `.env.${process.env.NODE_ENV || 'development'}`,
  '.env',
];

const parseEnvFile = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.split('\n').reduce((acc, line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return acc;
    const [key, ...rest] = trimmed.split('=');
    const value = rest.join('=').trim();
    acc[key.trim()] = value.replace(/^"|"$/g, '').replace(/^'|'$/g, '');
    return acc;
  }, {});
};

const resolvedEnv = envFiles.reduce((acc, fileName) => {
  const filePath = path.resolve(__dirname, fileName);
  if (fs.existsSync(filePath)) return { ...acc, ...parseEnvFile(filePath) };
  return acc;
}, {});

const buildDefinedEnv = (mode) => {
  const pyVars = Object.entries({ ...defaultFlags, ...resolvedEnv }).reduce(
    (acc, [k, v]) => { acc[`process.env.${k}`] = JSON.stringify(v); return acc; },
    {}
  );
  return {
    ...pyVars,
    'process.env.NODE_ENV':   JSON.stringify(mode || 'production'),
    // Prioridad: variable de shell > .env.{NODE_ENV} > fallback desarrollo.
    // Sin este orden, API_URL en .env.production era ignorado porque
    // process.env.API_URL (vacío en el CI/servidor) caía directo al fallback.
    'process.env.API_URL':    JSON.stringify(
      process.env.API_URL || resolvedEnv.API_URL || 'http://localhost:8000'
    ),
    'process.env.APP_VERSION': JSON.stringify(require('./package.json').version),
  };
};

module.exports = (env, argv) => {
  const isDev = argv.mode === 'development';
  const analyze = process.env.ANALYZE === 'true';

  return {
    mode: argv.mode || 'production',
    entry: './src/index.jsx',

    cache: {
      type: 'filesystem',
      cacheDirectory: path.resolve(__dirname, '.webpack_cache'),
      buildDependencies: { config: [__filename] },
    },

    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isDev ? '[name].js' : '[name].[contenthash].js',
      chunkFilename: isDev ? '[name].chunk.js' : '[name].[contenthash].chunk.js',
      publicPath: '/',
      clean: true,
    },

    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      alias: {
        // Aliases PracticaYoruba-UI — sincronizar con jest.config.cjs moduleNameMapper
        '@app':        path.resolve(__dirname, 'src/app'),
        '@modules':    path.resolve(__dirname, 'src/modules'),
        '@components': path.resolve(__dirname, 'src/components'),
        '@hooks':      path.resolve(__dirname, 'src/hooks'),
        '@state':      path.resolve(__dirname, 'src/state'),
        '@redux':      path.resolve(__dirname, 'src/redux'),
        '@services':   path.resolve(__dirname, 'src/services'),
        '@mocks':      path.resolve(__dirname, 'src/mocks'),
        '@styles':     path.resolve(__dirname, 'src/styles'),
        '@utils':      path.resolve(__dirname, 'src/utils'),
        '@types':      path.resolve(__dirname, 'src/types'),
        '@constants':  path.resolve(__dirname, 'src/constants'),
        '@pages':      path.resolve(__dirname, 'src/pages'),
        '@router':     path.resolve(__dirname, 'src/router'),
        '@config':     path.resolve(__dirname, 'src/config'),
        '@layouts':    path.resolve(__dirname, 'src/layouts'),
        '@context':    path.resolve(__dirname, 'src/context'),
        '@lib':        path.resolve(__dirname, 'src/lib'),
        '@facades':    path.resolve(__dirname, 'src/facades'),
        '@decorators': path.resolve(__dirname, 'src/decorators'),
      },
    },

    module: {
      rules: [
        {
          test: /\.(js|jsx|ts|tsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: { cacheDirectory: true },
          },
        },
        {
          test: /\.(css|scss)$/i,
          use: [
            isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
            'css-loader',
            'postcss-loader',
            'sass-loader',
          ],
        },
        {
          test: /\.(png|jpg|jpeg|gif|webp)$/i,
          type: 'asset',
          parser: { dataUrlCondition: { maxSize: 8 * 1024 } },
          generator: { filename: 'images/[name].[hash:8][ext]' },
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
          generator: { filename: 'fonts/[name].[hash:8][ext]' },
        },
        {
          test: /\.svg$/i,
          type: 'asset',
          parser: { dataUrlCondition: { maxSize: 4 * 1024 } },
        },
      ],
    },

    optimization: {
      minimize: !isDev,
      minimizer: !isDev ? [
        new TerserPlugin({
          parallel: true,
          terserOptions: {
            compress: {
              drop_console: true,
              drop_debugger: true,
              pure_funcs: ['console.log', 'console.info'],
            },
            format: { comments: false },
          },
          extractComments: false,
        }),
      ] : [],
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          react: {
            test: /[/\\]node_modules[/\\](react|react-dom|react-router)[/\\]/,
            name: 'react-vendors',
            priority: 11,
            reuseExistingChunk: true,
          },
          redux: {
            test: /[/\\]node_modules[/\\](redux|react-redux|@reduxjs)[/\\]/,
            name: 'redux-vendors',
            priority: 12,
            reuseExistingChunk: true,
          },
          charts: {
            test: /[/\\]node_modules[/\\](recharts|d3)[/\\]/,
            name: 'charts-vendors',
            priority: 13,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[/\\]node_modules[/\\]/,
            name: 'vendors',
            priority: 10,
            reuseExistingChunk: true,
          },
          common: {
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
            name: 'common',
          },
        },
        minSize: 20000,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
      },
      runtimeChunk: { name: 'runtime' },
    },

    plugins: [
      new HtmlWebpackPlugin({
        template: './public/index.html',
        inject: true,
        minify: !isDev && {
          removeComments: true,
          collapseWhitespace: true,
          removeAttributeQuotes: true,
        },
      }),
      new webpack.DefinePlugin(buildDefinedEnv(argv.mode)),
      !isDev && new MiniCssExtractPlugin({ filename: '[name].[contenthash].css' }),
      analyze && new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        reportFilename: path.resolve(__dirname, 'dist/bundle-report.html'),
        openAnalyzer: false,
        generateStatsFile: true,
        statsFilename: path.resolve(__dirname, 'dist/bundle-stats.json'),
      }),
    ].filter(Boolean),

    devServer: {
      port: 3001,
      hot: true,
      historyApiFallback: true,
      compress: true,
      static: {
        directory: path.join(__dirname, 'public'),
        serveIndex: false,
      },
      setupExitSignals: true,
      watchFiles: {
        paths: ['src/**/*', 'public/**/*'],
        options: { usePolling: false },
      },
      webSocketServer: 'ws',
      proxy: [
        {
          context: ['/api'],
          target: process.env.API_URL || 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
        },
      ],
      client: {
        overlay: { errors: true, warnings: false },
        logging: 'info',
        progress: true,
      },
    },

    devtool: isDev ? 'cheap-module-source-map' : 'source-map',

    performance: {
      hints: isDev ? false : 'warning',
      maxEntrypointSize: 300000,
      maxAssetSize: 250000,
      assetFilter: (name) =>
        !name.endsWith('.map') && !name.endsWith('.LICENSE.txt'),
    },
  };
};
