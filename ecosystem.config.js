module.exports = {
  apps: [
    {
      name: 'api',
      script: 'dist/server.js',
      env_production: {
        NODE_ENV: 'production',
      },
      env_development: {
        NODE_ENV: 'development',
      },
      max_memory_restart: '20G',
      instances: 'max',
      exec_mode: 'cluster',
    },
  ],
}
