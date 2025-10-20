import express, { Express } from "express"
import cors from "cors"
import routes from "./routes"
import { errorHandler } from "./middleware/errorHandler"

const version = `v1`;
const baseRoute = `api`;

const app: Express = express()

// CORS Configuration
const corsOptions = {
  origin: [
    'http://localhost:8080',
    'http://localhost:3000',
    'https://carta-production-d3bd.up.railway.app',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH',],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept'
  ],
  credentials: true // Enable if you need to send cookies or auth headers
};

// Apply CORS middleware BEFORE other middleware
app.use(cors(corsOptions));

// Use Express's built-in middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use(`/${baseRoute}/${version}/`, routes);

// Error Handling Middleware
app.use(errorHandler)

export default app