import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Input } from "@workspace/ui/components/input";
import { Badge } from "@workspace/ui/components/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import type { Issue } from "@/lib/types";
import { getIssues, updateIssue } from "@/lib/issues";
import { getSprint } from "@/lib/sprints";

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "text-red-600",
  high: "text-orange-500",
  medium: "text-yellow-500",
  low: "text-blue-500",
  none: "text-gray-400",
};

function IssueRow({
  issue,
  selected,
  onToggle,
}: {
  issue: Issue;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 hover:bg-muted/50">
      <Checkbox
        checked={selected}
        onCheckedChange={() => onToggle(issue.id)}
      />
      <span
        className={`text-xs font-bold ${PRIORITY_COLORS[issue.priority] ?? "text-gray-400"}`}
      >
        {issue.priority.charAt(0).toUpperCase()}
      </span>
      <span className="flex-1 truncate text-sm">{issue.title}</span>
      <Badge variant="outline" className="shrink-0 text-[10px]">
        {issue.status}
      </Badge>
      {issue.assignee && (
        <Avatar className="size-5 shrink-0">
          <AvatarImage src={issue.assignee.user.image ?? undefined} />
          <AvatarFallback className="text-[8px]">
            {issue.assignee.user.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
      )}
    </label>
  );
}

export function SprintPlanningPage() {
  const { projectId, sprintId } = useParams<{
    projectId: string;
    sprintId: string;
  }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [backlogSelected, setBacklogSelected] = useState<Set<string>>(
    new Set(),
  );
  const [sprintSelected, setSprintSelected] = useState<Set<string>>(
    new Set(),
  );
  const [backlogSearch, setBacklogSearch] = useState("");
  const [sprintSearch, setSprintSearch] = useState("");

  const { data: sprint, isLoading: sprintLoading } = useQuery({
    queryKey: ["sprints", sprintId],
    queryFn: () => getSprint(sprintId!),
    enabled: !!sprintId,
  });

  const { data: backlogIssues = [], isLoading: backlogLoading } = useQuery({
    queryKey: ["issues", { projectId, sprintId: "none" }],
    queryFn: () => getIssues({ projectId, sprintId: "none" }),
    enabled: !!projectId,
  });

  const { data: sprintIssues = [], isLoading: sprintIssuesLoading } = useQuery(
    {
      queryKey: ["issues", { projectId, sprintId }],
      queryFn: () => getIssues({ projectId, sprintId }),
      enabled: !!projectId && !!sprintId,
    },
  );

  const filteredBacklog = useMemo(
    () =>
      backlogSearch
        ? backlogIssues.filter((i) =>
            i.title.toLowerCase().includes(backlogSearch.toLowerCase()),
          )
        : backlogIssues,
    [backlogIssues, backlogSearch],
  );

  const filteredSprint = useMemo(
    () =>
      sprintSearch
        ? sprintIssues.filter((i) =>
            i.title.toLowerCase().includes(sprintSearch.toLowerCase()),
          )
        : sprintIssues,
    [sprintIssues, sprintSearch],
  );

  const addMutation = useMutation({
    mutationFn: (ids: Array<string>) =>
      Promise.all(ids.map((id) => updateIssue({ id, sprintId }))),
    onSuccess: () => {
      setBacklogSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      queryClient.invalidateQueries({ queryKey: ["sprints"] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (ids: Array<string>) =>
      Promise.all(ids.map((id) => updateIssue({ id, sprintId: null }))),
    onSuccess: () => {
      setSprintSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      queryClient.invalidateQueries({ queryKey: ["sprints"] });
    },
  });

  function toggleBacklog(id: string) {
    setBacklogSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSprint(id: string) {
    setSprintSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const isPending = addMutation.isPending || removeMutation.isPending;

  if (sprintLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!sprint) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <p className="text-muted-foreground">Sprint not found</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => navigate(`/projects/${projectId}`)}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold">Plan: {sprint.name}</h1>
          <p className="text-sm text-muted-foreground">
            {format(new Date(sprint.startDate), "MMM d")} &mdash;{" "}
            {format(new Date(sprint.endDate), "MMM d, yyyy")}
            {sprint.goal && <> &middot; {sprint.goal}</>}
          </p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-1 gap-4 min-h-0">
        {/* Backlog column */}
        <div className="flex flex-1 flex-col gap-2 min-h-0">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">
              Backlog ({backlogIssues.length})
            </h2>
          </div>
          <Input
            placeholder="Search backlog..."
            value={backlogSearch}
            onChange={(e) => setBacklogSearch(e.target.value)}
            className="h-8 text-sm"
          />
          <div className="flex-1 overflow-y-auto rounded-lg border">
            {backlogLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredBacklog.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {backlogSearch ? "No matching issues" : "No issues in backlog"}
              </p>
            ) : (
              <div className="divide-y">
                {filteredBacklog.map((issue) => (
                  <IssueRow
                    key={issue.id}
                    issue={issue}
                    selected={backlogSelected.has(issue.id)}
                    onToggle={toggleBacklog}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col items-center justify-center gap-2">
          <Button
            size="sm"
            disabled={backlogSelected.size === 0 || isPending}
            onClick={() => addMutation.mutate([...backlogSelected])}
          >
            {addMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                Add <ChevronRight className="ml-1 size-4" />
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={sprintSelected.size === 0 || isPending}
            onClick={() => removeMutation.mutate([...sprintSelected])}
          >
            {removeMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <ChevronLeft className="mr-1 size-4" /> Remove
              </>
            )}
          </Button>
        </div>

        {/* Sprint column */}
        <div className="flex flex-1 flex-col gap-2 min-h-0">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">
              Sprint ({sprintIssues.length})
            </h2>
          </div>
          <Input
            placeholder="Search sprint..."
            value={sprintSearch}
            onChange={(e) => setSprintSearch(e.target.value)}
            className="h-8 text-sm"
          />
          <div className="flex-1 overflow-y-auto rounded-lg border">
            {sprintIssuesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredSprint.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {sprintSearch
                  ? "No matching issues"
                  : "No issues in this sprint"}
              </p>
            ) : (
              <div className="divide-y">
                {filteredSprint.map((issue) => (
                  <IssueRow
                    key={issue.id}
                    issue={issue}
                    selected={sprintSelected.has(issue.id)}
                    onToggle={toggleSprint}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
