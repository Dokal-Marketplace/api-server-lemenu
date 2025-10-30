import express, { Express } from "express"
import cors from "cors"
import routes from "./routes"
import { errorHandler } from "./middleware/errorHandler"
import { inngestServe } from "./services/inngestService"
import menuParserRoute from "./routes/menuParserRoute"

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

// Capture raw JSON body for signature verification (e.g., pawaPay)
app.use(express.raw({ type: 'application/json' }));
app.use((req, res, next) => {
  const contentType = req.headers['content-type'] || ''
  const isJson = typeof contentType === 'string' && contentType.includes('application/json')
  if (isJson && Buffer.isBuffer((req as any).body)) {
    const raw = (req as any).body.toString('utf8')
    ;(req as any).rawBody = raw
    try {
      (req as any).body = raw ? JSON.parse(raw) : {}
    } catch {
      return res.status(400).send('Invalid JSON')
    }
  }
  return next()
})

// Use Express's built-in middleware (runs after raw-body capture)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use(`/${baseRoute}/${version}/`, routes);

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