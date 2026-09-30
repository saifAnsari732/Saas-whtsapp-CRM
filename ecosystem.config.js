module.exports = {
  apps: [
    {
      name: "chatflyr",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      env: {
        NODE_ENV: "production",
        NODE_OPTIONS: "--max-old-space-size=1536",
      },
      max_memory_restart: "1200M",
      restart_delay: 3000,
      autorestart: true,
    },
  ],
};
