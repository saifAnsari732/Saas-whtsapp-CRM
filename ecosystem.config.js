module.exports = {
  apps: [
    {
      name: "chatflyr",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
      max_memory_restart: "1200M",
      restart_delay: 2000,
      autorestart: true,
    },
  ],
};
