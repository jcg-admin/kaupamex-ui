const path = require('path');
const webpack = require('webpack');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const TerserPlugin = require('terser-webpack-plugin');

// Feature flags Kaupamex — controlan si el backend es real o mock
const defaultFlags = {
  PY_CATALOG_SOURCE: 'mock',
  PY_AUTH_SOURCE: 'mock',
  PY_CART_SOURCE: 'mock',
  PY_PAYMENTS_SOURCE: 'mock',
};

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

// H-ENV-1: el flag `--mode production` que pasa `npm run build` NO setea
// process.env.NODE_ENV durante la carga de este config. Si leyeramos
// .env.{process.env.NODE_ENV} a top-level cae siempre al fallback
// 'development', .env.production se ignora y DefinePlugin no inyecta las
// REACT_APP_*. Resolvemos los .env DENTRO del callback (env, argv) =>
// donde argv.mode ya refleja el flag real de webpack.
const resolveEnv = (mode) => {
  const files = [`.env.${mode}`, '.env'];
  return files.reduce((acc, fileName) => {
    const filePath = path.resolve(__dirname, fileName);
    if (fs.existsSync(filePath)) return { ...acc, ...parseEnvFile(filePath) };
    return acc;
  }, {});
};

const buildDefinedEnv = (mode, resolvedEnv) => {
  const pyVars = Object.entries({ ...defaultFlags, ...resolvedEnv }).reduce(
    (acc, [k, v]) => { acc[`process.env.${k}`] = JSON.stringify(v); return acc; },
    {}
  );
  return {
    ...pyVars,
    'process.env.NODE_ENV':   JSON.stringify(mode || 'production'),
    // En DEV el baseURL del bundle es RELATIVO ('') para que las requests
    // viajen misma-origin (:3001) y el devServer.proxy las reenvíe a :8000
    // (la cookie de sesión viaja — SOL-081). Un shell API_URL explícito lo
    // sobreescribe. En PROD se usa el dominio absoluto (mismo origen).
    'process.env.API_URL':    JSON.stringify(
      mode === 'development'
        ? (process.env.API_URL ?? '')
        : (process.env.API_URL || resolvedEnv.API_URL || 'http://localhost:8000')
    ),
    // Master switch del mock interceptor (SOL-081): 'mock' (default) mockea
    // /api en dev; cualquier otro valor ('db'/'real') lo desactiva → backend
    // real. El E2E full-stack exporta PY_API_SOURCE=db para probar de verdad.
    'process.env.PY_API_SOURCE': JSON.stringify(process.env.PY_API_SOURCE || 'mock'),
    'process.env.APP_VERSION': JSON.stringify(require('./package.json').version),
  };
};

module.exports = (env, argv) => {
  const mode = argv.mode || 'production';
  const isDev = mode === 'development';
  const analyze = process.env.ANALYZE === 'true';
  const resolvedEnv = resolveEnv(mode);

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
        // Aliases Kaupamex-UI — sincronizar con jest.config.cjs moduleNameMapper
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
        '@constants':  path.resolve(__dirname, 'src/constants'),
        '@pages':      path.resolve(__dirname, 'src/pages'),
        '@router':     path.resolve(__dirname, 'src/router'),
        '@config':     path.resolve(__dirname, 'src/config'),
        '@layouts':    path.resolve(__dirname, 'src/layouts'),
        '@context':    path.resolve(__dirname, 'src/context'),
        '@lib':        path.resolve(__dirname, 'src/lib'),
        '@facades':    path.resolve(__dirname, 'src/facades'),
        '@assets':     path.resolve(__dirname, 'src/assets'),
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
            {
              loader: 'sass-loader',
              options: {
                sassOptions: {
                  importers: [{
                    findFileUrl(url) {
                      const aliases = {
                        '@styles': path.resolve(__dirname, 'src/styles'),
                        '@assets': path.resolve(__dirname, 'src/assets'),
                      };
                      for (const [alias, dir] of Object.entries(aliases)) {
                        if (url.startsWith(alias + '/')) {
                          const resolved = dir + '/' + url.slice(alias.length + 1);
                          return new URL('file://' + resolved);
                        }
                      }
                      return null;
                    },
                  }],
                },
              },
            },
          ],
        },
        {
          test: /\.(png|jpg|jpeg|gif|webp)$/i,
          type: 'asset',
          parser: { dataUrlCondition: { maxSize: 8 * 1024 } },
          // Salida en la RAIZ del dist (no images/) para que el AliasMatch
          // de Apache en prod (^/([^/]+\.png)$, solo nivel raiz) los sirva.
          // Bajo images/ caian al serve_spa de Django -> index.html y el
          // logo nunca cargaba. Ver actualizar-produccion-vm.rst.
          generator: { filename: '[name].[hash:8][ext]' },
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
          generator: { filename: '[name].[hash:8][ext]' },
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
      new webpack.DefinePlugin(buildDefinedEnv(mode, resolvedEnv)),
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
          // Target del proxy en su PROPIA variable (independiente de API_URL,
          // que en dev es relativo). Default :8000. SOL-081.
          target: process.env.API_PROXY_TARGET || 'http://localhost:8000',
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
      // React 18 + ReactDOM + react-router alone account for ~200 KiB min.
      // With Redux and app bootstrap code the irreducible entrypoint is ~430 KiB
      // when all pages are already lazy-loaded. 512 KiB guards against real bloat.
      maxEntrypointSize: 524288,
      maxAssetSize: 250000,
      assetFilter: (name) =>
        !name.endsWith('.map') && !name.endsWith('.LICENSE.txt'),
    },
  };
};
