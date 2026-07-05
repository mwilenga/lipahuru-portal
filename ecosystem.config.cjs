const path = require("path");

module.exports = {
  apps: [
    {
      name: "lipahuru-portal",
      cwd: path.resolve(__dirname),
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3001",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      error_file: "./deploy/logs/pm2-error.log",
      out_file: "./deploy/logs/pm2-out.log",
      merge_logs: true,
      time: true,
    },
  ],
};
