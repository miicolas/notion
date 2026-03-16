import { createAuthClient } from "better-auth/react"
import { organizationClient, customSessionClient } from "better-auth/client/plugins"
import type { auth } from "@api/auth"
import { API_URL } from "./api"

export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: [organizationClient(), customSessionClient<typeof auth>()],
})

export const { signIn, signUp, signOut, useSession } = authClient
