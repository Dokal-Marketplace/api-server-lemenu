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
  cors: {
    origin: [
      'http://localhost:8080',
      'http://localhost:3000',
    ],
    methods: ["GET", "POST"],
    credentials: true,
  }
})

// Store io on the app so specific routers can access it when needed
app.set("io", io)

connectToDB()
server.listen(config.port, () => {
  console.log(
    `${config.nodeEnv} - Server is running on http://localhost:${config.port}/${baseRoute}/${version}`
  )
})
