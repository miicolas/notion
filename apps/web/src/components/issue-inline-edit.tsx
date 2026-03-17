import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { UserCircle } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import {
  
  IssueStatusIcon,
  statusConfig
} from "./issue-status-icon";
import {
  IssuePriorityIcon,
  
  priorityConfig
} from "./issue-priority-icon";
import { UserAvatar } from "./user-avatar";
import type {IssueStatus} from "./issue-status-icon";
import type {Priority} from "./issue-priority-icon";
import { getMembers } from "@/lib/members";
import { updateIssue } from "@/lib/issues";

function useInlineUpdate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateIssue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      queryClient.invalidateQueries({ queryKey: ["issue"] });
    },
  });
}

export function StatusDropdown({
  issueId,
  value,
  children,
}: {
  issueId: string;
  value: string;
  children?: React.ReactNode;
}) {
  const mutation = useInlineUpdate();
  const config = statusConfig[value as IssueStatus];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children ?? (
          <button className="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-accent transition-colors">
            <IssueStatusIcon status={value as IssueStatus} />
            <span>{config.label}</span>
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-40">
        <DropdownMenuLabel>Status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(v) => mutation.mutate({ id: issueId, status: v })}
        >
          {(
            Object.entries(statusConfig) as Array<[
              IssueStatus,
              (typeof statusConfig)[IssueStatus],
            ]>
          ).map(([key, cfg]) => (
            <DropdownMenuRadioItem key={key} value={key}>
              <IssueStatusIcon status={key} />
              <span>{cfg.label}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function PriorityDropdown({
  issueId,
  value,
  children,
}: {
  issueId: string;
  value: string;
  children?: React.ReactNode;
}) {
  const mutation = useInlineUpdate();
  const config = priorityConfig[value as Priority];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children ?? (
          <button className="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-accent transition-colors">
            <IssuePriorityIcon priority={value as Priority} />
            <span>{config.label}</span>
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-40">
        <DropdownMenuLabel>Priority</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(v) => mutation.mutate({ id: issueId, priority: v })}
        >
          {(
            Object.entries(priorityConfig) as Array<[
              Priority,
              (typeof priorityConfig)[Priority],
            ]>
          ).map(([key, cfg]) => (
            <DropdownMenuRadioItem key={key} value={key}>
              <IssuePriorityIcon priority={key} />
              <span>{cfg.label}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AssigneeDropdown({
  issueId,
  assignee,
  children,
}: {
  issueId: string;
  assignee?: {
    user: { id: string; name: string; image?: string | null };
  } | null;
  children?: React.ReactNode;
}) {
  const mutation = useInlineUpdate();
  const { data: members = [] } = useQuery({
    queryKey: ["members"],
    queryFn: getMembers,
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children ?? (
          <button className="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-accent transition-colors">
            {assignee ? (
              <>
                <UserAvatar
                  name={assignee.user.name}
                  image={assignee.user.image}
                />
                <span>{assignee.user.name}</span>
              </>
            ) : (
              <>
                <UserCircle className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">Unassigned</span>
              </>
            )}
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-48">
        <DropdownMenuLabel>Assignee</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => mutation.mutate({ id: issueId, assigneeId: null })}
          className={cn(!assignee && "bg-accent")}
        >
          <UserCircle className="size-4 text-muted-foreground" />
          <span>Unassigned</span>
        </DropdownMenuItem>
        {members.map((member) => (
          <DropdownMenuItem
            key={member.id}
            onClick={() =>
              mutation.mutate({ id: issueId, assigneeId: member.id })
            }
            className={cn(assignee?.user.id === member.user.id && "bg-accent")}
          >
            <UserAvatar name={member.user.name} image={member.user.image} />
            <span>{member.user.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
