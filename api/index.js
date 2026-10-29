// Vercel rewrites all /api/* requests here to keep the Hobby function count low.
import handler from "./_app.js";

export default function apiHandler(req, res) {
  const url = new URL(req.url || "/api", "http://localhost");
  const route = req.query?.__api_path;

  if (typeof route === "string") {
    url.pathname = `/api/${route.replace(/^\/+/, "")}`;
    url.searchParams.delete("__api_path");
    req.url = `${url.pathname}${url.search}`;
  }

  return handler(req, res);
}
