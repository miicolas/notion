import { createFileRoute, Outlet, redirect, useLocation } from "@tanstack/react-router"
import { getSession } from "@/lib/session"
import { getUserOrganizations } from "@/lib/organization"
import { getProjects } from "@/lib/projects"
import { SidebarLeft } from "@/components/sidebar-left"
import { SidebarRight } from "@/components/sidebar-right"
import {
  SidebarInset,
  SidebarProvider,
} from "@workspace/ui/components/sidebar"

export const Route = createFileRoute("/_authed")({
  beforeLoad: async ({ location }) => {
    const session = await getSession()

    if (!session) {
      throw redirect({
        to: "/sign-in",
        search: { redirect: location.href },
      })
    }

    const organizations = await getUserOrganizations()

    if (organizations.length === 0 && location.pathname !== "/onboarding") {
      throw redirect({ to: "/onboarding" })
    }

    return {
      user: session.user,
      organizations,
      activeOrganization: session.activeOrganization,
    }
  },
  loader: async () => {
    try {
      const projects = await getProjects()
      return { projects }
    } catch {
      return { projects: [] }
    }
  },
  component: AuthedLayout,
})

function AuthedLayout() {
  const { user, organizations, activeOrganization } = Route.useRouteContext()
  const { projects } = Route.useLoaderData()
  const location = useLocation()

  // Skip sidebar layout for onboarding
  if (location.pathname === "/onboarding" || organizations.length === 0) {
    return <Outlet />
  }

  return (
    <SidebarProvider>
      <SidebarLeft
        organizations={organizations}
        activeOrganization={activeOrganization}
        projects={projects}
      />
      <SidebarInset>
        <Outlet />
      </SidebarInset>
      <SidebarRight user={user} />
    </SidebarProvider>
  )
}
