import { createAuthClient } from "better-auth/react";
import { customSessionClient } from "better-auth/client/plugins";
import type { auth } from "@api/auth";
import { API_URL } from "./api";

export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: [customSessionClient<typeof auth>()],
});

export const { signIn, signOut, useSession } = authClient;
