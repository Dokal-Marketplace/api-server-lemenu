import http from "http"
import app from "./app"
import { config } from "./config"
import { connectToDB } from "./config/mongoose";
import { Server as SocketIOServer } from "socket.io"
import logger from "./utils/logger";

const version = `v1`;
const baseRoute = `api`;

// Create HTTP server and Socket.IO instance
const server = http.createServer(app)
const io = new SocketIOServer(server, {
  path: "/socket.io/",
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
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
  if (!localId || !subDomain) {
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
})

// Low-level connection error diagnostics
io.engine.on("connection_error", (err) => {
  logger.error("socket.io engine connection_error:", {
    code: err.code,
    message: err.message,
    context: err.context,
  })
})

// Store io on the app so specific routers can access it when needed
app.set("io", io)

connectToDB()
server.listen(config.port, () => {
  console.log(
    `${config.nodeEnv} - Server is running on http://localhost:${config.port}/${baseRoute}/${version}`
  )
})
