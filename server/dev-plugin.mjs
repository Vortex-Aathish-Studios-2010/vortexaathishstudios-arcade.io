import { mkdirSync } from "node:fs";
import { arcade } from "./arcade.mjs";
import { openArcadeDB } from "./local-db.mjs";
export function localArcade() {
  return {
    name: "local-arcade",
    configureServer(server) {
      mkdirSync(".arcade-local", { recursive: true });
      const db = openArcadeDB(".arcade-local/game.sqlite");
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/arcade/")) return next();
        try {
          const parts = [];
          for await (const chunk of req) parts.push(chunk);
          const url = new URL(req.url, "http://" + req.headers.host);
          const request = new Request(url, {
            method: req.method,
            headers: req.headers,
            body: parts.length ? Buffer.concat(parts) : undefined,
          });
          const response = await arcade(request, db);
          res.writeHead(response.status, Object.fromEntries(response.headers));
          res.end(await response.text());
        } catch (err) {
          next(err);
        }
      });
    },
  };
}
