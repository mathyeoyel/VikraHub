// craco.config.js - Custom React App Configuration Override
module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Suppress HMR warnings in development
      if (process.env.NODE_ENV === 'development') {
        webpackConfig.infrastructureLogging = {
          level: 'error',
        };
        
        // Reduce webpack-dev-server warnings
        if (webpackConfig.devServer) {
          webpackConfig.devServer.client = {
            logging: 'error',
            overlay: {
              errors: true,
              warnings: false,
            },
          };
        }
      }
      
      return webpackConfig;
    },
  },
};
