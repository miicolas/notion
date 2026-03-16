import { authClient } from "./auth-client"

export async function getUserOrganizations() {
  const { data } = await authClient.organization.list()
  return data ?? []
}

export async function getUserInvitations() {
  const { data } = await authClient.organization.listUserInvitations()
  return data ?? []
}
