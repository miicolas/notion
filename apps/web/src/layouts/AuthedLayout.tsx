import { Outlet, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  SidebarInset,
  SidebarProvider,
} from "@workspace/ui/components/sidebar";
import { useAuth } from "@/lib/auth-context";
import { getProjects } from "@/lib/projects";
import { SidebarLeft } from "@/components/sidebar-left";
import { SidebarRight } from "@/components/sidebar-right";

export function AuthedLayout() {
  const { user, organizations, activeOrganization } = useAuth();
  const location = useLocation();

  const { data: projects = [] } = useQuery({
    queryKey: ["projects", activeOrganization?.id],
    queryFn: getProjects,
    enabled: !!activeOrganization,
  });

  if (location.pathname === "/onboarding" || organizations.length === 0) {
    return <Outlet />;
  }

  return (
    <SidebarProvider>
      <SidebarLeft
        organizations={organizations}
        activeOrganization={activeOrganization}
        projects={projects}
      />
      <SidebarInset className="min-w-0 overflow-auto">
        <Outlet />
      </SidebarInset>
      <SidebarRight user={user!} />
    </SidebarProvider>
  );
}
