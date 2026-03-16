import { useState } from "react";
import { format } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { startSprint, completeSprint, deleteSprint } from "@/lib/sprints";
import { SprintForm } from "@/components/sprint-form";
import { Play, CheckCircle, Pencil, Trash2, Plus } from "lucide-react";
import type { Sprint } from "@/lib/types";

const statusVariant: Record<
  Sprint["status"],
  "default" | "secondary" | "outline"
> = {
  planned: "outline",
  active: "default",
  completed: "secondary",
};

export function SprintList({
  sprints,
  projectId,
}: {
  sprints: Sprint[];
  projectId: string;
}) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);

  const startMutation = useMutation({
    mutationFn: startSprint,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints"] });
      queryClient.invalidateQueries({ queryKey: ["issues"] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: completeSprint,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints"] });
      queryClient.invalidateQueries({ queryKey: ["issues"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSprint,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints"] });
      queryClient.invalidateQueries({ queryKey: ["issues"] });
    },
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
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{sprint.name}</span>
                <Badge variant={statusVariant[sprint.status]}>
                  {sprint.status}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                {sprint.status === "planned" && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => startMutation.mutate(sprint.id)}
                    disabled={startMutation.isPending}
                    title="Start sprint"
                  >
                    <Play className="size-4" />
                  </Button>
                )}
                {sprint.status === "active" && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => completeMutation.mutate(sprint.id)}
                    disabled={completeMutation.isPending}
                    title="Complete sprint"
                  >
                    <CheckCircle className="size-4" />
                  </Button>
                )}
                {sprint.status !== "completed" && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleEdit(sprint)}
                    title="Edit sprint"
                  >
                    <Pencil className="size-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => deleteMutation.mutate(sprint.id)}
                  disabled={deleteMutation.isPending}
                  title="Delete sprint"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              {format(new Date(sprint.startDate), "MMM d, yyyy")} &mdash;{" "}
              {format(new Date(sprint.endDate), "MMM d, yyyy")}
            </div>
            {sprint.goal && (
              <p className="text-xs text-muted-foreground">{sprint.goal}</p>
            )}
          </div>
        ))}
      </div>

      <SprintForm
        sprint={editingSprint}
        projectId={projectId}
        open={showForm}
        onOpenChange={handleCloseForm}
      />
    </div>
  );
}
