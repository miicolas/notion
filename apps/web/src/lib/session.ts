import { createServerFn } from "@tanstack/react-start"
import { getRequest } from "@tanstack/react-start/server"
import { authClient } from "./auth-client"

export const getSession = createServerFn({ method: "GET" }).handler(
  async () => {
    const request = getRequest()
    const { data: session } = await authClient.getSession({
      fetchOptions: {
        headers: request.headers,
      },
    })
    return session
  },
)
