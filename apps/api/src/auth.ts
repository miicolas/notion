import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import {
  admin as adminPlugin,
  openAPI,
  multiSession,
  organization,
  customSession,
} from "better-auth/plugins";
import { db } from "./db";
import * as schema from "./db/schema";
import { eq } from "drizzle-orm";
import { ac, admin, user } from "./auth/permissions";
import { getActiveOrgId } from "./auth/session";
import { env } from "./env";

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  trustedOrigins: env.CORS_ORIGINS,
  emailAndPassword: {
    enabled: true,
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          // Auto-set active organization when session is created
          const members = await db.query.member.findMany({
            where: eq(schema.member.userId, session.userId),
          });
          if (members.length > 0) {
            return {
              data: {
                ...session,
                activeOrganizationId: members[0].organizationId,
              },
            };
          }
          return { data: session };
        },
      },
    },
  },
  plugins: [
    adminPlugin({
      ac,
      roles: {
        admin,
        user,
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any -- ac.newRole({}) produces `never` constraint
    }),
    organization({
      teams: { enabled: true },
    }),
    openAPI(),
    multiSession(),
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
