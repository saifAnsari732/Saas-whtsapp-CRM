module.exports = {
  apps: [
    {
      name: "chatflyr",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
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
