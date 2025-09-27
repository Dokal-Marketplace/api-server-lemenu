import app from "./app"
import { config } from "./config"
import { connectToDB } from "./config/mongoose";

const version = `v1`;
const baseRoute = `api`;
connectToDB()
app.listen(config.port, () => {
  console.log(
    `${config.nodeEnv} - Server is running on http://localhost:${config.port}/${baseRoute}/${version}`
  )
})
