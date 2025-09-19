import express, { Express } from "express"
import routes from "./routes"
import { errorHandler } from "./middleware/errorHandler"

const app: Express = express()

// Use Express's built-in middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Routes
app.use("/", routes)

// Error Handling Middleware
app.use(errorHandler)

export default app
