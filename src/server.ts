import app from "./app"
import { config } from "./config"

const version = `v1`;
const baseRoute = `api`;

app.listen(config.port, () => {
  console.log(
    `${config.nodeEnv} - Server is running on http://localhost:${config.port}/${baseRoute}/${version}`
  )
})
