import { Link } from "@tanstack/react-router"
import { FolderKanban, Plus } from "lucide-react"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar"
import type { Project } from "@/lib/types"

export function NavProjects({ projects }: { projects: Project[] }) {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Projects</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map((project) => (
          <SidebarMenuItem key={project.id}>
            <SidebarMenuButton asChild>
              <Link to="/projects/$projectId" params={{ projectId: project.id }} search={{ view: "table" }}>
                <FolderKanban className="size-4" />
                <span>{project.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Link to="/projects" search={{ create: true }}>
              <Plus className="size-4" />
              <span>New project</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}
