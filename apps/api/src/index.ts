import "dotenv/config";
import { serve } from "@hono/node-server";
import { app } from "./app";

export default app;

serve({ fetch: app.fetch, port: 3001 }, () => {
  console.log("Server is running on http://localhost:3001");
});
