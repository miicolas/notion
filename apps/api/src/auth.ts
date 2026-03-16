import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import {
  admin as adminPlugin,
  openAPI,
  multiSession,
  organization,
  customSession,
  testUtils,
} from "better-auth/plugins";
import { db } from "./db";
import * as schema from "./db/schema";
import { eq } from "drizzle-orm";
import { ac, admin, user } from "./auth/permissions";
import { getActiveOrgId } from "./auth/session";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  trustedOrigins: ["http://localhost:3000"],
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    adminPlugin({
      ac,
      roles: {
        admin,
        user,
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any -- ac.newRole({}) produces `never` constraint
    }),
    organization(),
    openAPI(),
    multiSession(),
    testUtils({ captureOTP: true }),
    customSession(async ({ user, session }) => {
      let activeOrganization = null;

      const activeOrgId = getActiveOrgId(session as Record<string, unknown>);

      if (activeOrgId) {
        const org = await db.query.organization.findFirst({
          where: eq(schema.organization.id, activeOrgId),
        });
        if (org) {
          activeOrganization = {
            id: org.id,
            name: org.name,
            slug: org.slug,
            logo: org.logo,
          };
        }
      }

      return {
        activeOrganization,
        user,
        session,
      };
    }),
  ],
});
