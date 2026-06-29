import { createApi } from "./index.js";
import { createHttpServer } from "./http/server.js";

const port = Number(process.env.PORT ?? 4000);
const app = createHttpServer(createApi());

app.listen(port, () => {
  console.log(`BOSS API listening on :${port}`);
});
