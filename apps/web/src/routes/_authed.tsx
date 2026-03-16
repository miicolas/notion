import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { getSession } from "@/lib/session"

export const Route = createFileRoute("/_authed")({
  beforeLoad: async ({ location }) => {
    const session = await getSession()

    if (!session) {
      throw redirect({
        to: "/sign-in",
        search: { redirect: location.href },
      })
    }

    return { user: session.user }
  },
  component: () => <Outlet />,
})
