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
import adminBackupsRoutes from "./routes/admin-backups";
import { adminMiddleware } from "./middleware/admin";
import type { AdminContext } from "./middleware/admin";

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

app.on(["POST", "GET"], "/api/auth/**", async (c) => {
  const response = await auth.handler(c.req.raw);
  // Copy auth response into Hono context so CORS middleware can add headers
  c.status(response.status as any);
  response.headers.forEach((value, key) => {
    c.header(key, value);
  });
  return c.body(response.body);
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
app.route("/api/admin/backups", (() => {
  const backupApp = new Hono<{ Variables: { admin: AdminContext } }>();
  backupApp.use("*", adminMiddleware);
  backupApp.route("/", adminBackupsRoutes);
  return backupApp;
})());
app.route("/api/admin", adminRoutes);

app.get("/", (c) => {
  return c.json({ message: "API is running" });
});

export { app };
