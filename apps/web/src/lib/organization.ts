import { createServerFn } from "@tanstack/react-start"
import { getRequest } from "@tanstack/react-start/server"
import { authClient } from "./auth-client"

export const getUserOrganizations = createServerFn({ method: "GET" }).handler(
  async () => {
    const request = getRequest()
    const { data } = await authClient.organization.list({
      fetchOptions: {
        headers: request.headers,
      },
    })
    return data ?? []
  },
)

export const getUserInvitations = createServerFn({ method: "GET" }).handler(
  async () => {
    const request = getRequest()
    const { data } = await authClient.organization.listUserInvitations({
      fetchOptions: {
        headers: request.headers,
      },
    })
    return data ?? []
  },
)
