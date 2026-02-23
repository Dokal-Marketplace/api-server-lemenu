import express, { Express } from "express"
import cors from "cors"
import routes from "./routes"
import { errorHandler } from "./middleware/errorHandler"
import { inngestServe } from "./services/inngestService"
import menuParserRoute from "./routes/menuParserRoute"

const version = `v1`;
const baseRoute = `api`;
const app: Express = express()

// CORS Configuration — origins driven by ALLOWED_ORIGINS env variable
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept'
  ],
  credentials: true
};

// Apply CORS middleware BEFORE other middleware
app.use(cors(corsOptions));

// Body parsing middleware — limit size to prevent memory exhaustion
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Routes
app.use(`/${baseRoute}/${version}`, routes);

// Inngest endpoint for background job processing
app.use('/api/inngest', inngestServe);

// Menu parser routes
app.use(`/${baseRoute}/${version}/menu-parser`, menuParserRoute);

// Health check endpoint
app.get('/health', (_, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      inngest: 'available',
      menuParser: 'available'
    }
  });
});

// Error Handling Middleware
app.use(errorHandler)

export default app
