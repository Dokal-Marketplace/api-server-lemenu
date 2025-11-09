import http from "http"
import app from "./app"
import { config } from "./config"
import { connectToDB } from "./config/mongoose";
import { Server as SocketIOServer } from "socket.io"

const version = `v1`;
const baseRoute = `api`;

// Create HTTP server and Socket.IO instance
const server = http.createServer(app)
const io = new SocketIOServer(server, {
  path: "/socket.io",
  transports: ["websocket", "polling"],
  pingTimeout: 20000,
  pingInterval: 25000,
  cors: {
    // Allow local dev and any production origin (adjust if you want to restrict)
    origin: "*",
    methods: ["GET", "POST"],
    credentials: false,
  }
})

// Enforce required query params and join rooms
io.use((socket, next) => {
  const { localId, subDomain } = socket.handshake.query as Record<string, string | undefined>
  // Log handshake data to diagnose early-close issues
  console.log("Socket.IO handshake:", {
    url: socket.handshake.url,
    localId,
    subDomain,
    headers: {
      host: socket.handshake.headers.host,
      origin: socket.handshake.headers.origin,
      referer: socket.handshake.headers.referer,
      upgrade: socket.handshake.headers.upgrade
    }
  })
  if (!localId || !subDomain) {
    console.warn("Socket.IO handshake missing params", { localId, subDomain })
    return next(new Error("Missing required query params: localId and subDomain"))
  }
  socket.data.localId = localId
  socket.data.subDomain = subDomain
  return next()
})

io.on("connection", (socket) => {
  const localId = socket.data.localId as string
  const subDomain = socket.data.subDomain as string
  if (subDomain) socket.join(`subdomain:${subDomain}`)
  if (localId) socket.join(`local:${localId}`)
  socket.emit("connected", { localId, subDomain })
  console.log("Socket connected:", { socketId: socket.id, localId, subDomain })

  // Handle WhatsApp chat room joining per-socket
  socket.on('join-room', (data: { clientPhone: string; chatbotNumber: string }) => {
    const { clientPhone, chatbotNumber } = data
    const roomName = `chat-${clientPhone}-${chatbotNumber}`
    socket.join(roomName)
    console.log(`Socket ${socket.id} joined chat room: ${roomName}`)
  })

  // Handle bot state changes per-socket
  socket.on('botStateChange', (data: { clientPhone: string; chatbotNumber: string; newState: boolean }) => {
    const { clientPhone, chatbotNumber, newState } = data
    const roomName = `chat-${clientPhone}-${chatbotNumber}`
    io.to(roomName).emit('botStateUpdate', {
      clientPhone,
      chatbotNumber,
      isEnabled: newState
    })
  })

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", { socketId: socket.id, reason })
  })
})

// Log low-level engine.io connection errors to aid debugging in production
io.engine.on("connection_error", (err) => {
  console.error("Socket.IO connection error:", {
    req: {
      url: err.req?.url,
      headers: {
        host: err.req?.headers?.host,
        origin: err.req?.headers?.origin,
        referer: err.req?.headers?.referer,
        "user-agent": err.req?.headers?.["user-agent"],
        upgrade: err.req?.headers?.upgrade
      }
    },
    code: err.code,
    message: err.message,
    context: err.context
  })
})

// Store io on the app so specific routers can access it when needed
app.set("io", io)

connectToDB()
  .then(() => {
    const { whatsappHealthMonitor } = require('./services/whatsapp/whatsappHealthMonitor');
    whatsappHealthMonitor.start();
    console.log('Database connected and WhatsApp health monitor started');
  })
  .catch((error) => {
    console.error('Failed to connect to database:', error);
    // Retry connection every 5 seconds
    const retryInterval = setInterval(async () => {
      try {
        await connectToDB();
        clearInterval(retryInterval);
        const { whatsappHealthMonitor } = require('./services/whatsapp/whatsappHealthMonitor');
        whatsappHealthMonitor.stop(); // Stop if already started
        whatsappHealthMonitor.start();
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
