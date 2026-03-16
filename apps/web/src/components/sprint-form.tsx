import * as React from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { Calendar } from "@workspace/ui/components/calendar";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RiCalendarLine } from "@remixicon/react";
import { createSprint, updateSprint } from "@/lib/sprints";
import { cn } from "@workspace/ui/lib/utils";
import type { Sprint } from "@/lib/types";

export function SprintForm({
  sprint,
  projectId,
  open,
  onOpenChange,
}: {
  sprint?: Sprint | null;
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [startDate, setStartDate] = React.useState<Date | undefined>(
    sprint?.startDate ? new Date(sprint.startDate) : undefined,
  );
  const [endDate, setEndDate] = React.useState<Date | undefined>(
    sprint?.endDate ? new Date(sprint.endDate) : undefined,
  );

  React.useEffect(() => {
    if (open) {
      setStartDate(sprint?.startDate ? new Date(sprint.startDate) : undefined);
      setEndDate(sprint?.endDate ? new Date(sprint.endDate) : undefined);
    }
  }, [open, sprint]);

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => {
      if (sprint) return updateSprint({ id: sprint.id, ...data } as any);
      return createSprint({ projectId, ...data } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints"] });
      onOpenChange(false);
    },
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    mutation.mutate({
      name: formData.get("name") as string,
      goal: (formData.get("goal") as string) || undefined,
      startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
      endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{sprint ? "Edit sprint" : "New sprint"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={sprint?.name ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal">Goal</Label>
            <Textarea id="goal" name="goal" defaultValue={sprint?.goal ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground",
                    )}
                  >
                    <RiCalendarLine className="mr-2 size-4" />
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>End date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground",
                    )}
                  >
                    <RiCalendarLine className="mr-2 size-4" />
                    {endDate ? format(endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || !startDate || !endDate}
            >
              {mutation.isPending ? "Saving..." : sprint ? "Save" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
