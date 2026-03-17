import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, ChevronDown, Plus } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar";
import type { Organization } from "@/lib/types";
import { authClient } from "@/lib/auth-client";
import { useAuth } from "@/lib/auth-context";

export function TeamSwitcher({
  organizations,
  activeOrganization,
}: {
  organizations: Array<Organization>;
  activeOrganization?: Organization | null;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { refetch } = useAuth();
  const activeOrg = activeOrganization ?? organizations[0];

  async function handleSwitchOrg(org: Organization) {
    await authClient.organization.setActive({
      organizationId: org.id,
    });
    await refetch();
    queryClient.invalidateQueries();
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!activeOrg) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="w-fit px-1.5">
              <div className="flex aspect-square size-5 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                <Building2 className="size-3" />
              </div>
              <span className="truncate font-semibold">{activeOrg.name}</span>
              <ChevronDown className="opacity-50" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-64 rounded-lg"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Organizations
            </DropdownMenuLabel>
            {organizations.map((org, index) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => handleSwitchOrg(org)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  <Building2 className="size-4 shrink-0" />
                </div>
                {org.name}
                <DropdownMenuShortcut>{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 p-2"
              onClick={() => navigate("/onboarding")}
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">
                Add organization
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
