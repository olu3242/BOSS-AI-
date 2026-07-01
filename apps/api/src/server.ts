import { createApi } from "./index.js";
import { createHttpServer } from "./http/server.js";

if (!process.env.SUPABASE_JWT_SECRET) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("SUPABASE_JWT_SECRET must be set in production");
  }
  process.env.SUPABASE_JWT_SECRET = "dev-only-insecure-secret-do-not-use-in-production";
}

const port = Number(process.env.PORT ?? 4000);
const app = createHttpServer(createApi());

app.listen(port, () => {
  console.log(`BOSS API listening on :${port}`);
});
