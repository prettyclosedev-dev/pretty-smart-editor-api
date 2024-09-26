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
      instances: 1,                
      exec_mode: 'fork',           
      node_args: ["--max_old_space_size=22000"],
      max_restarts: 30,
      min_uptime: "3000",
      restart_delay: 3000,
      exp_backoff_restart_delay: 100
    },
  ],
}
