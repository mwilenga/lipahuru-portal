const path = require("path");

const root = path.resolve(__dirname);

module.exports = {
  apps: [
    {
      name: "lipahuru-portal-sandbox",
      cwd: root,
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3002",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3002,
      },
      error_file: "./deploy/logs/pm2-error-sandbox.log",
      out_file: "./deploy/logs/pm2-out-sandbox.log",
      merge_logs: true,
      time: true,
    },
    {
      name: "lipahuru-portal-prod",
      cwd: root,
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
      error_file: "./deploy/logs/pm2-error-prod.log",
      out_file: "./deploy/logs/pm2-out-prod.log",
      merge_logs: true,
      time: true,
    },
  ],
};
