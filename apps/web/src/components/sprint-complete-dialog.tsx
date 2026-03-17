import * as React from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Sprint } from "@/lib/types";
import { transitionSprint } from "@/lib/sprints";

export function SprintCompleteDialog({
  sprint,
  open,
  onOpenChange,
}: {
  sprint: Sprint;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [retrospective, setRetrospective] = React.useState("");

  React.useEffect(() => {
    if (open) setRetrospective("");
  }, [open]);

  const mutation = useMutation({
    mutationFn: () =>
      transitionSprint(sprint.id, "completed", retrospective),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["sprints"] }),
        queryClient.invalidateQueries({ queryKey: ["issues"] }),
      ]),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Complete sprint</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg border p-3 text-sm">
            <p className="font-medium">{sprint.name}</p>
            <p className="text-muted-foreground">
              {format(new Date(sprint.startDate), "MMM d, yyyy")} &mdash;{" "}
              {format(new Date(sprint.endDate), "MMM d, yyyy")}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="retrospective">Retrospective *</Label>
            <Textarea
              id="retrospective"
              placeholder="What went well? What could be improved?"
              value={retrospective}
              onChange={(e) => setRetrospective(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Incomplete issues will be moved back to the backlog.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              mutation.mutateAsync().then(() => onOpenChange(false))
            }
            disabled={mutation.isPending || !retrospective.trim()}
          >
            {mutation.isPending ? "Completing..." : "Complete sprint"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
