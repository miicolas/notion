import { Outlet, useLocation } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/lib/auth-context"
import { getProjects } from "@/lib/projects"
import { SidebarLeft } from "@/components/sidebar-left"
import { SidebarRight } from "@/components/sidebar-right"
import {
  SidebarInset,
  SidebarProvider,
} from "@workspace/ui/components/sidebar"

export function AuthedLayout() {
  const { user, organizations, activeOrganization } = useAuth()
  const location = useLocation()

  const { data: projects = [] } = useQuery({
    queryKey: ["projects", activeOrganization?.id],
    queryFn: getProjects,
    enabled: !!activeOrganization,
  })

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
      <SidebarRight user={user!} />
    </SidebarProvider>
  )
}
