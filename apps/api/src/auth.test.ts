import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { auth } from "./auth";

const uniqueEmail = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;

describe("auth", () => {
  let test: Awaited<typeof auth.$context>["test"];

  beforeAll(async () => {
    const ctx = await auth.$context;
    test = ctx.test;
  });

  describe("user creation and session", () => {
    let userId: string;

    afterAll(async () => {
      if (userId) await test.deleteUser(userId);
    });

    it("should create and save a user", async () => {
      const email = uniqueEmail("user");
      const user = test.createUser({ email, name: "Test User" });
      const saved = await test.saveUser(user);
      userId = saved.id;

      expect(saved.email).toBe(email);
      expect(saved.name).toBe("Test User");
    });

    it("should login and get authenticated headers", async () => {
      const { session, user, headers } = await test.login({ userId });

      expect(session).toBeDefined();
      expect(session.userId).toBe(userId);
      expect(headers).toBeDefined();
    });

    it("should get session from auth headers", async () => {
      const headers = await test.getAuthHeaders({ userId });
      const session = await auth.api.getSession({ headers });

      expect(session?.user.id).toBe(userId);
    });
  });

  describe("admin operations", () => {
    let adminId: string;
    let regularUserId: string;

    afterAll(async () => {
      if (regularUserId) await test.deleteUser(regularUserId);
      if (adminId) await test.deleteUser(adminId);
    });

    it("should setup admin and create a user via admin API", async () => {
      // Create admin
      const adminUser = test.createUser({
        email: uniqueEmail("admin"),
        name: "Admin",
      });
      const saved = await test.saveUser(adminUser);
      adminId = saved.id;

      const ctx = await auth.$context;
      await ctx.internalAdapter.updateUser(adminId, { role: "admin" });

      // Create regular user via admin API
      const adminHeaders = await test.getAuthHeaders({ userId: adminId });
      const result = await auth.api.createUser({
        headers: adminHeaders,
        body: {
          email: uniqueEmail("regular"),
          password: "securepassword123",
          name: "Regular User",
          role: "user",
        },
      });

      regularUserId = (result as any).user?.id ?? (result as any).id;
      expect(regularUserId).toBeDefined();
    });

    it("should list users", async () => {
      const adminHeaders = await test.getAuthHeaders({ userId: adminId });
      const result = await auth.api.listUsers({
        headers: adminHeaders,
        query: { limit: "100" },
      });

      expect(result.users.length).toBeGreaterThanOrEqual(2);
    });

    it("should ban and unban a user", async () => {
      const adminHeaders = await test.getAuthHeaders({ userId: adminId });

      await auth.api.banUser({
        headers: adminHeaders,
        body: { userId: regularUserId, banReason: "Test ban" },
      });

      const banned = await auth.api.getUser({
        headers: adminHeaders,
        query: { id: regularUserId },
      });
      const bannedFlag =
        (banned as any)?.user?.banned ?? (banned as any)?.banned;
      expect(bannedFlag).toBe(true);

      await auth.api.unbanUser({
        headers: adminHeaders,
        body: { userId: regularUserId },
      });

      const unbanned = await auth.api.getUser({
        headers: adminHeaders,
        query: { id: regularUserId },
      });
      const unbannedFlag =
        (unbanned as any)?.user?.banned ?? (unbanned as any)?.banned;
      expect(unbannedFlag).toBe(false);
    });
  });
});
