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
import dashboardRoutes from "./routes/dashboard";
import sprintsRoutes from "./routes/sprints";
import teamsRoutes from "./routes/teams";

const ORIGIN = "https://d2v9z14bwlzu0y.cloudfront.net";

function setCorsHeaders(headers: Headers) {
  headers.set("Access-Control-Allow-Origin", ORIGIN);
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, DELETE, OPTIONS",
  );
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

const app = new Hono();

app.use(
  "/api/*",
  cors({
    origin: "http://localhost:3000",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

app.on(["POST", "GET", "OPTIONS"], "/api/auth/**", (c) => {
  return auth.handler(c.req.raw);
});

app.route("/api/clients", clientsRoutes);
app.route("/api/projects", projectsRoutes);
app.route("/api/issues", issuesRoutes);
app.route("/api/labels", labelsRoutes);
app.route("/api/comments", commentsRoutes);
app.route("/api/members", membersRoutes);
app.route("/api/dashboard", dashboardRoutes);
app.route("/api/sprints", sprintsRoutes);
app.route("/api/teams", teamsRoutes);

app.get("/", (c) => {
  return c.json({ message: "API is running" });
});

serve({ fetch: app.fetch, port: 3001 }, () => {
  console.log("Server is running on http://localhost:3001");
});
