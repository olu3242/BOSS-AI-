import { createApi } from "./index.js";
import { createHttpServer } from "./http/server.js";

// JWT verification uses SUPABASE_URL → JWKS endpoint (ES256, preferred)
// or SUPABASE_JWT_SECRET (HS256, fallback). At least one must be set in production.
if (process.env.NODE_ENV === "production" && !process.env.SUPABASE_URL && !process.env.SUPABASE_JWT_SECRET) {
  throw new Error("Set SUPABASE_URL (for JWKS) or SUPABASE_JWT_SECRET in production");
}

const port = Number(process.env.PORT ?? 4000);
const app = createHttpServer(createApi());

app.listen(port, () => {
  console.log(`BOSS API listening on :${port}`);
});
