import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { transitionSprint, deleteSprint } from "@/lib/sprints";
import { SprintForm } from "@/components/sprint-form";
import { SprintCompleteDialog } from "@/components/sprint-complete-dialog";
import { SprintComments } from "@/components/sprint-comments";
import {
  Play,
  Pencil,
  Trash2,
  Plus,
  ArrowLeft,
  Eye,
  FileText,
  ClipboardList,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import type { Sprint, Member } from "@/lib/types";

const STATUS_COLORS: Record<Sprint["status"], string> = {
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  planned:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  active: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  in_review:
    "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  completed:
    "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
};

const STATUS_LABELS: Record<Sprint["status"], string> = {
  draft: "Draft",
  planned: "Planned",
  active: "Active",
  in_review: "In Review",
  completed: "Completed",
};

const RELEASE_LABELS: Record<string, string> = {
  pre_release: "Pre-release",
  release_candidate: "RC",
  released: "Released",
};

const DURATION_LABELS: Record<string, string> = {
  "1w": "1w",
  "2w": "2w",
  "3w": "3w",
  "1m": "1m",
  custom: "Custom",
};

export function SprintList({
  sprints,
  projectId,
  members,
  currentUserId,
}: {
  sprints: Sprint[];
  projectId: string;
  members?: Member[];
  currentUserId?: string;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [completingSprint, setCompletingSprint] = useState<Sprint | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const transitionMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      transitionSprint(id, status),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["sprints"] }),
        queryClient.invalidateQueries({ queryKey: ["issues"] }),
      ]),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSprint,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["sprints"] }),
        queryClient.invalidateQueries({ queryKey: ["issues"] }),
      ]),
  });

  function handleEdit(sprint: Sprint) {
    setEditingSprint(sprint);
    setShowForm(true);
  }

  function handleCloseForm(open: boolean) {
    setShowForm(open);
    if (!open) setEditingSprint(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Sprints</h3>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="mr-1 size-4" />
          New sprint
        </Button>
      </div>

      {sprints.length === 0 && (
        <p className="text-sm text-muted-foreground">No sprints yet.</p>
      )}

      <div className="flex flex-col gap-3">
        {sprints.map((sprint) => (
          <div
            key={sprint.id}
            className="flex flex-col gap-2 rounded-lg border p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <button
                  type="button"
                  className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={() =>
                    setExpandedId(
                      expandedId === sprint.id ? null : sprint.id,
                    )
                  }
                >
                  {expandedId === sprint.id ? (
                    <ChevronDown className="size-4" />
                  ) : (
                    <ChevronRight className="size-4" />
                  )}
                </button>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium leading-tight">{sprint.name}</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${STATUS_COLORS[sprint.status]}`}
                    >
                      {STATUS_LABELS[sprint.status]}
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {DURATION_LABELS[sprint.duration] ?? sprint.duration}
                    </Badge>
                    {sprint.releaseStatus && (
                      <Badge variant="secondary" className="text-[10px]">
                        {RELEASE_LABELS[sprint.releaseStatus]}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {sprint.owner && (
                  <Avatar className="size-6" title={sprint.owner.user.name}>
                    <AvatarImage
                      src={sprint.owner.user.image ?? undefined}
                    />
                    <AvatarFallback className="text-[10px]">
                      {sprint.owner.user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                )}
                {sprint.sprintMembers && sprint.sprintMembers.length > 0 && (
                  <div className="flex -space-x-1">
                    {sprint.sprintMembers.slice(0, 3).map((sm) => (
                      <Avatar
                        key={sm.member.id}
                        className="size-5 border border-background"
                        title={sm.member.user.name}
                      >
                        <AvatarImage
                          src={sm.member.user.image ?? undefined}
                        />
                        <AvatarFallback className="text-[8px]">
                          {sm.member.user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {sprint.sprintMembers.length > 3 && (
                      <span className="flex size-5 items-center justify-center rounded-full border border-background bg-muted text-[8px] font-medium">
                        +{sprint.sprintMembers.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Actions per status */}
                {sprint.status === "draft" && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => navigate(`/projects/${projectId}/sprint-planning/${sprint.id}`)}
                      title="Plan issues"
                    >
                      <ClipboardList className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        transitionMutation.mutate({
                          id: sprint.id,
                          status: "planned",
                        })
                      }
                      disabled={transitionMutation.isPending}
                      title="Move to planned"
                    >
                      <FileText className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleEdit(sprint)}
                      title="Edit"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => deleteMutation.mutate(sprint.id)}
                      disabled={deleteMutation.isPending}
                      title="Delete"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </>
                )}
                {sprint.status === "planned" && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => navigate(`/projects/${projectId}/sprint-planning/${sprint.id}`)}
                      title="Plan issues"
                    >
                      <ClipboardList className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        transitionMutation.mutate({
                          id: sprint.id,
                          status: "active",
                        })
                      }
                      disabled={transitionMutation.isPending}
                      title="Start sprint"
                    >
                      <Play className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        transitionMutation.mutate({
                          id: sprint.id,
                          status: "draft",
                        })
                      }
                      disabled={transitionMutation.isPending}
                      title="Back to draft"
                    >
                      <ArrowLeft className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleEdit(sprint)}
                      title="Edit"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => deleteMutation.mutate(sprint.id)}
                      disabled={deleteMutation.isPending}
                      title="Delete"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </>
                )}
                {sprint.status === "active" && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        transitionMutation.mutate({
                          id: sprint.id,
                          status: "in_review",
                        })
                      }
                      disabled={transitionMutation.isPending}
                      title="Move to review"
                    >
                      <Eye className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleEdit(sprint)}
                      title="Edit"
                    >
                      <Pencil className="size-4" />
                    </Button>
                  </>
                )}
                {sprint.status === "in_review" && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setCompletingSprint(sprint)}
                      disabled={transitionMutation.isPending}
                      title="Complete sprint"
                    >
                      <FileText className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        transitionMutation.mutate({
                          id: sprint.id,
                          status: "active",
                        })
                      }
                      disabled={transitionMutation.isPending}
                      title="Back to active"
                    >
                      <ArrowLeft className="size-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              {format(new Date(sprint.startDate), "MMM d, yyyy")} &mdash;{" "}
              {format(new Date(sprint.endDate), "MMM d, yyyy")}
            </div>
            {sprint.goal && (
              <p className="text-xs text-muted-foreground">{sprint.goal}</p>
            )}
            {sprint.retrospective && (
              <div className="rounded border-l-2 border-blue-400 bg-blue-50 p-2 text-xs dark:bg-blue-950">
                <span className="font-medium">Retrospective:</span>{" "}
                {sprint.retrospective}
              </div>
            )}

            {/* Expanded: show comments */}
            {expandedId === sprint.id && (
              <div className="mt-2 border-t pt-3">
                <SprintComments
                  sprintId={sprint.id}
                  currentUserId={currentUserId}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <SprintForm
        sprint={editingSprint}
        projectId={projectId}
        members={members}
        open={showForm}
        onOpenChange={handleCloseForm}
        sprintCount={sprints.length}
      />

      {completingSprint && (
        <SprintCompleteDialog
          sprint={completingSprint}
          open={!!completingSprint}
          onOpenChange={(open) => {
            if (!open) setCompletingSprint(null);
          }}
        />
      )}

    </div>
  );
}
