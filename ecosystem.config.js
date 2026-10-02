const path = require("path");

module.exports = {
  apps: [
    {
      name: "chatflyr",
      script: "npm",
      args: "start",
      cwd: path.resolve(__dirname),
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
      max_memory_restart: "1500M",
      restart_delay: 2000,
      autorestart: true,
    },
  ],
};
