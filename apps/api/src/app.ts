import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./auth";
import { env } from "./env";
import clientsRoutes from "./routes/clients";
import projectsRoutes from "./routes/projects";
import issuesRoutes from "./routes/issues";
import labelsRoutes from "./routes/labels";
import commentsRoutes from "./routes/comments";
import membersRoutes from "./routes/members";
import dashboardRoutes from "./routes/dashboard";
import sprintsRoutes from "./routes/sprints";
import sprintCommentsRoutes from "./routes/sprint-comments";
import teamsRoutes from "./routes/teams";
import adminRoutes from "./routes/admin";

const app = new Hono();

app.use(
  "/api/*",
  cors({
    origin: env.CORS_ORIGINS,
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
app.route("/api/sprint-comments", sprintCommentsRoutes);
app.route("/api/teams", teamsRoutes);
app.route("/api/admin", adminRoutes);

app.get("/", (c) => {
  return c.json({ message: "API is running" });
});

export { app };
