import { createServer } from "node:http";
import { createHealthCheck } from "./health.js";

const port = Number(process.env.PORT ?? process.env.BOSS_API_PORT ?? 4000);
const host = process.env.HOST ?? "127.0.0.1";

const server = createServer((request, response) => {
  if (request.url === "/health") {
    const body = JSON.stringify(createHealthCheck("in_memory"));
    response.writeHead(200, {
      "content-type": "application/json; charset=utf-8",
    });
    response.end(body);
    return;
  }

  response.writeHead(200, {
    "content-type": "application/json; charset=utf-8",
  });
  response.end(
    JSON.stringify({
      name: "BOSS API",
      status: "ok",
      health: "/health",
    })
  );
});

server.listen(port, host, () => {
  console.log(`BOSS API dev server listening at http://${host}:${port}`);
});
