import { arcade } from "./arcade.mjs";
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/arcade/")) return arcade(request, env.DB);
    const response = await env.ASSETS.fetch(request);
    if (
      response.status === 404 &&
      request.headers.get("accept")?.includes("text/html")
    ) {
      return env.ASSETS.fetch(
        new Request(new URL("/index.html", url), request),
      );
    }
    return response;
  },
};
