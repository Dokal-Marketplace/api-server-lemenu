import http from "http"
import mongoose from "mongoose"
import app from "./app"
import { config } from "./config"
import { connectToDB } from "./config/mongoose"
import { whatsappHealthMonitor } from "./services/whatsapp/whatsappHealthMonitor"

const version = `v1`;
const baseRoute = `api`;

const server = http.createServer(app)

// Graceful shutdown handler
const gracefulShutdown = (signal: string) => {
  console.log(`Received ${signal}, starting graceful shutdown...`);

  // Force-exit if clean shutdown takes longer than 10 seconds
  const forceExitTimer = setTimeout(() => {
    console.error('Graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, 10000);
  // Don't keep the process alive just for this timer
  forceExitTimer.unref();

  server.close(async () => {
    console.log('HTTP server closed');

    try {
      whatsappHealthMonitor.stop();
    } catch (error) {
      console.error('Error stopping health monitor:', error);
    }

    try {
      await mongoose.connection.close();
      console.log('Database connection closed');
    } catch (error) {
      console.error('Error closing database:', error);
    }

    clearTimeout(forceExitTimer);
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Only start listening after the database is connected
connectToDB()
  .then(() => {
    console.log('Database connected and ready');
    server.listen(config.port, () => {
      console.log(
        `${config.nodeEnv} - Server is running on http://localhost:${config.port}/${baseRoute}/${version}`
      );
    });
  })
  .catch((error) => {
    console.error('Failed to connect to database:', error);
    // Retry connection every 5 seconds
    const retryInterval = setInterval(async () => {
      try {
        await connectToDB();
        clearInterval(retryInterval);
        console.log('Database connected after retry, starting server');
        server.listen(config.port, () => {
          console.log(
            `${config.nodeEnv} - Server is running on http://localhost:${config.port}/${baseRoute}/${version}`
          );
        });
      } catch (retryError) {
        console.error('Retry connection failed:', retryError);
      }
    }, 5000);
  });

