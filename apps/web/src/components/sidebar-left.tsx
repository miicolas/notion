import * as React from "react";
import {
  Home,
  Users,
  UsersRound,
  FolderKanban,
  Tags,
  Settings2,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavSecondary } from "@/components/nav-secondary";
import { TeamSwitcher } from "@/components/team-switcher";
import type { Organization, Project } from "@/lib/types";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@workspace/ui/components/sidebar";

const navMain = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
    isActive: true,
  },
  {
    title: "Clients",
    url: "/clients",
    icon: Users,
  },
  {
    title: "Projects",
    url: "/projects",
    icon: FolderKanban,
  },
  {
    title: "Teams",
    url: "/teams",
    icon: UsersRound,
  },
];

const navSecondary = [
  {
    title: "Labels",
    url: "/labels",
    icon: Tags,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings2,
  },
];

export function SidebarLeft({
  organizations,
  activeOrganization,
  projects = [],
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  organizations: Organization[];
  activeOrganization?: Organization | null;
  projects?: Project[];
}) {
  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader>
        <TeamSwitcher
          organizations={organizations}
          activeOrganization={activeOrganization}
        />
        <NavMain items={navMain} />
      </SidebarHeader>
      <SidebarContent>
        <NavProjects projects={projects} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
