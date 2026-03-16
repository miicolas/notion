import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { auth } from "./auth";
import clientsRoutes from "./routes/clients";
import projectsRoutes from "./routes/projects";
import issuesRoutes from "./routes/issues";
import labelsRoutes from "./routes/labels";
import commentsRoutes from "./routes/comments";
import membersRoutes from "./routes/members";

const ORIGIN = "http://localhost:3000";

function setCorsHeaders(headers: Headers) {
  headers.set("Access-Control-Allow-Origin", ORIGIN);
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, DELETE, OPTIONS",
  );
  headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
  );
}

const app = new Hono();

app.use(
  "/api/*",
  cors({
    origin: ORIGIN,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

app.route("/api/clients", clientsRoutes);
app.route("/api/projects", projectsRoutes);
app.route("/api/issues", issuesRoutes);
app.route("/api/labels", labelsRoutes);
app.route("/api/comments", commentsRoutes);
app.route("/api/members", membersRoutes);

app.get("/", (c) => {
  return c.json({ message: "API is running" });
});

serve(
  {
    fetch: async (req) => {
      const url = new URL(req.url);

      // Handle auth routes directly, bypassing Hono middleware
      if (url.pathname.startsWith("/api/auth")) {
        if (req.method === "OPTIONS") {
          const headers = new Headers();
          setCorsHeaders(headers);
          return new Response(null, { status: 204, headers });
        }

        const response = await auth.handler(req);
        const headers = new Headers(response.headers);
        setCorsHeaders(headers);
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      }

      // All other routes go through Hono
      return app.fetch(req);
    },
    port: 3001,
  },
  () => {
    console.log("Server is running on http://localhost:3001");
  },
);
