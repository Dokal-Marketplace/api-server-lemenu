import http from "http"
import app from "./app"
import { config } from "./config"
import { connectToDB } from "./config/mongoose";

const version = `v1`;
const baseRoute = `api`;

// Create HTTP server and Socket.IO instance
const server = http.createServer(app)



// Store io on the app so specific routers can access it when needed

connectToDB()
  .then(() => {
    console.log('Database connected and ready');
  })
  .catch((error) => {
    console.error('Failed to connect to database:', error);
    // Retry connection every 5 seconds
    const retryInterval = setInterval(async () => {
      try {
        await connectToDB();
        clearInterval(retryInterval);
        console.log('Database connected and health monitor started after retry');
      } catch (retryError) {
        console.error('Retry connection failed:', retryError);
      }
    }, 5000);
  });

server.listen(config.port, () => {
  console.log(
    `${config.nodeEnv} - Server is running on http://localhost:${config.port}/${baseRoute}/${version}`
  )
})

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}, starting graceful shutdown...`);
  
  server.close(() => {
    console.log('HTTP server closed');
  });
  
  try {
    const { whatsappHealthMonitor } = require('./services/whatsapp/whatsappHealthMonitor');
    whatsappHealthMonitor.stop();
  } catch (error) {
    console.error('Error stopping health monitor:', error);
  }
  
  try {
    const mongoose = require('mongoose');
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error closing database:', error);
  }
  
  setTimeout(() => process.exit(1), 10000);
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
