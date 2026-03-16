import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import * as schema from "../db/schema";
import { authMiddleware, type AuthContext } from "../middleware/auth";

const app = new Hono<{ Variables: { auth: AuthContext } }>();

app.use("*", authMiddleware);

// GET /api/clients
app.get("/", async (c) => {
  const { organizationId } = c.get("auth");

  const clients = await db.query.client.findMany({
    where: eq(schema.client.organizationId, organizationId),
    with: { projects: { columns: { id: true } } },
    orderBy: (client, { desc }) => [desc(client.createdAt)],
  });

  return c.json(clients);
});

// POST /api/clients
app.post("/", async (c) => {
  const { organizationId } = c.get("auth");
  const body = await c.req.json();

  const id = crypto.randomUUID();
  const [created] = await db
    .insert(schema.client)
    .values({
      id,
      organizationId,
      name: body.name,
      email: body.email,
      phone: body.phone,
      address: body.address,
      website: body.website,
      logo: body.logo,
      notes: body.notes,
    })
    .returning();

  return c.json(created, 201);
});

// GET /api/clients/:id
app.get("/:id", async (c) => {
  const { organizationId } = c.get("auth");
  const id = c.req.param("id");

  const found = await db.query.client.findFirst({
    where: and(
      eq(schema.client.id, id),
      eq(schema.client.organizationId, organizationId),
    ),
    with: { projects: true },
  });

  if (!found) return c.json({ error: "Not found" }, 404);
  return c.json(found);
});

// PATCH /api/clients/:id
app.patch("/:id", async (c) => {
  const { organizationId } = c.get("auth");
  const id = c.req.param("id");
  const body = await c.req.json();
  const { name, email, phone, address, website, logo, notes } = body;

  const [updated] = await db
    .update(schema.client)
    .set({ name, email, phone, address, website, logo, notes })
    .where(
      and(
        eq(schema.client.id, id),
        eq(schema.client.organizationId, organizationId),
      ),
    )
    .returning();

  if (!updated) return c.json({ error: "Not found" }, 404);
  return c.json(updated);
});

// DELETE /api/clients/:id
app.delete("/:id", async (c) => {
  const { organizationId } = c.get("auth");
  const id = c.req.param("id");

  const [deleted] = await db
    .delete(schema.client)
    .where(
      and(
        eq(schema.client.id, id),
        eq(schema.client.organizationId, organizationId),
      ),
    )
    .returning();

  if (!deleted) return c.json({ error: "Not found" }, 404);
  return c.json({ success: true });
});

export default app;
