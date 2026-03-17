import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarSeparator,
} from "@workspace/ui/components/sidebar";
import type {Priority} from "@/components/issue-priority-icon";
import { DatePicker } from "@/components/date-picker";
import { NavUser } from "@/components/nav-user";
import {
  IssuePriorityIcon
  
} from "@/components/issue-priority-icon";
import { useAuth } from "@/lib/auth-context";
import { getIssues } from "@/lib/issues";
import { getMembers } from "@/lib/members";

export function SidebarRight({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: { name: string; email: string; image?: string | null };
}) {
  const { user: authUser } = useAuth();
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>();

  const { data: members } = useQuery({
    queryKey: ["members"],
    queryFn: getMembers,
  });

  const currentMember = React.useMemo(
    () => members?.find((m) => m.user.id === authUser?.id),
    [members, authUser?.id],
  );

  const { data: issues } = useQuery({
    queryKey: ["issues", "assigned", currentMember?.id],
    queryFn: () => getIssues({ assigneeId: currentMember!.id }),
    enabled: !!currentMember?.id,
  });

  const taskDates = React.useMemo(() => {
    if (!issues) return [];
    const dates: Array<Date> = [];
    for (const issue of issues) {
      if (issue.deadline) {
        dates.push(new Date(issue.deadline));
      }
    }
    return dates;
  }, [issues]);

  const filteredIssues = React.useMemo(() => {
    if (!issues) return [];
    if (selectedDate) {
      const dateStr = selectedDate.toISOString().split("T")[0];
      return issues.filter(
        (issue) => issue.deadline && issue.deadline.startsWith(dateStr),
      );
    }
    // Show upcoming tasks (with deadline >= today)
    const today = new Date().toISOString().split("T")[0];
    return issues
      .filter((issue) => issue.deadline && issue.deadline >= today)
      .sort((a, b) => (a.deadline! > b.deadline! ? 1 : -1));
  }, [issues, selectedDate]);

  return (
    <Sidebar
      collapsible="none"
      className="sticky hidden lg:flex top-0 h-svh border-l"
      {...props}
    >
      <SidebarHeader className="h-16 border-b border-sidebar-border">
        <NavUser user={user} />
      </SidebarHeader>
      <SidebarContent>
        <DatePicker
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          taskDates={taskDates}
        />
        <SidebarSeparator className="mx-0" />
        <SidebarGroup>
          <SidebarGroupLabel>
            {selectedDate
              ? selectedDate.toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                })
              : "Upcoming tasks"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="flex flex-col gap-1 px-2">
              {filteredIssues.length === 0 && (
                <p className="text-xs text-muted-foreground py-2">
                  No tasks {selectedDate ? "for this day" : "upcoming"}
                </p>
              )}
              {filteredIssues.map((issue) => (
                <Link
                  key={issue.id}
                  to={`/issues/${issue.id}`}
                  className="flex items-start gap-2 rounded-md p-2 text-sm hover:bg-sidebar-accent"
                >
                  <IssuePriorityIcon
                    priority={issue.priority as Priority}
                    className="mt-0.5 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{issue.title}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {issue.project && <span>{issue.project.name}</span>}
                      {issue.project && issue.deadline && <span>·</span>}
                      {issue.deadline && (
                        <span>
                          {new Date(issue.deadline).toLocaleDateString(
                            "fr-FR",
                            {
                              day: "numeric",
                              month: "short",
                            },
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
