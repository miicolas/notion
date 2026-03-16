import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import {
  admin as adminPlugin,
  openAPI,
  multiSession,
  testUtils,
} from "better-auth/plugins";
import { db } from "./db";
import { ac, admin, user } from "./auth/permissions";

export const auth = betterAuth({
  
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    adminPlugin({
      ac,
      roles: {
        admin,
        user,
      },
    }),
    openAPI(),
    multiSession(),
    testUtils({ captureOTP: true }),
  ],
});
