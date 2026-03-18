import * as React from "react";
import { addMonths, addWeeks, format } from "date-fns";
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
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RiCalendarLine } from "@remixicon/react";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { cn } from "@workspace/ui/lib/utils";
import type { Member, Sprint } from "@/lib/types";
import { createSprint, updateSprint, updateSprintMembers } from "@/lib/sprints";

type Duration = "1w" | "2w" | "3w" | "1m" | "custom";

function computeEndDate(start: Date, duration: Duration): Date {
  switch (duration) {
    case "1w":
      return addWeeks(start, 1);
    case "2w":
      return addWeeks(start, 2);
    case "3w":
      return addWeeks(start, 3);
    case "1m":
      return addMonths(start, 1);
    default:
      return start;
  }
}

const DURATION_LABELS: Record<Duration, string> = {
  "1w": "1 week",
  "2w": "2 weeks",
  "3w": "3 weeks",
  "1m": "1 month",
  custom: "Custom",
};

export function SprintForm({
  sprint,
  projectId,
  members,
  open,
  onOpenChange,
  sprintCount = 0,
}: {
  sprint?: Sprint | null;
  projectId: string;
  members?: Array<Member>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sprintCount?: number;
}) {
  const queryClient = useQueryClient();
  const [duration, setDuration] = React.useState<Duration>(
    sprint?.duration ?? "2w",
  );
  const [startDate, setStartDate] = React.useState<Date | undefined>(
    sprint?.startDate ? new Date(sprint.startDate) : undefined,
  );
  const [endDate, setEndDate] = React.useState<Date | undefined>(
    sprint?.endDate ? new Date(sprint.endDate) : undefined,
  );
  const [ownerId, setOwnerId] = React.useState<string>(
    sprint?.ownerId ?? "none",
  );
  const [releaseStatus, setReleaseStatus] = React.useState<string>(
    sprint?.releaseStatus ?? "none",
  );
  const [selectedMembers, setSelectedMembers] = React.useState<Set<string>>(
    new Set(sprint?.sprintMembers?.map((sm) => sm.member.id) ?? []),
  );

  React.useEffect(() => {
    if (open) {
      setDuration(sprint?.duration ?? "2w");
      setStartDate(sprint?.startDate ? new Date(sprint.startDate) : undefined);
      setEndDate(sprint?.endDate ? new Date(sprint.endDate) : undefined);
      setOwnerId(sprint?.ownerId ?? "none");
      setReleaseStatus(sprint?.releaseStatus ?? "none");
      setSelectedMembers(
        new Set(sprint?.sprintMembers?.map((sm) => sm.member.id) ?? []),
      );
    }
  }, [open, sprint]);

  // Auto-compute end date when duration or start date changes
  React.useEffect(() => {
    if (startDate && duration !== "custom") {
      setEndDate(computeEndDate(startDate, duration));
    }
  }, [startDate, duration]);

  const mutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const memberIds = data.memberIds as Array<string>;
      const { memberIds: _, ...sprintData } = data;
      let result;
      if (sprint) {
        result = await updateSprint({ id: sprint.id, ...sprintData } as any);
        await updateSprintMembers(sprint.id, memberIds);
      } else {
        result = await createSprint({ projectId, ...sprintData } as any);
        await updateSprintMembers(result.id, memberIds);
      }
      return result;
    },
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    mutation
      .mutateAsync({
        name: formData.get("name") as string,
        goal: (formData.get("goal") as string) || undefined,
        startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
        endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
        duration,
        ownerId: ownerId === "none" ? null : ownerId,
        releaseStatus: releaseStatus === "none" ? null : releaseStatus,
        memberIds: [...selectedMembers],
      })
      .then(() => queryClient.invalidateQueries({ queryKey: ["sprints"] }))
      .then(() => onOpenChange(false));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{sprint ? "Edit sprint" : "New sprint"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
          key={sprint?.id ?? `new-${sprintCount}`}
        >
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={sprint?.name ?? `Sprint ${sprintCount + 1}`}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal">Goal</Label>
            <Textarea id="goal" name="goal" defaultValue={sprint?.goal ?? ""} />
          </div>

          {/* Duration preset */}
          <div className="space-y-2">
            <Label>Duration</Label>
            <ToggleGroup
              type="single"
              value={duration}
              onValueChange={(val) => {
                if (val) setDuration(val as Duration);
              }}
              className="justify-start"
            >
              {(Object.keys(DURATION_LABELS) as Array<Duration>).map((d) => (
                <ToggleGroupItem key={d} value={d} size="sm">
                  {DURATION_LABELS[d]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
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
              {duration !== "custom" ? (
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  disabled
                >
                  <RiCalendarLine className="mr-2 size-4" />
                  {endDate ? format(endDate, "PPP") : "Auto-calculated"}
                </Button>
              ) : (
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
              )}
            </div>
          </div>

          {/* Owner selector */}
          {members && members.length > 0 && (
            <div className="space-y-2">
              <Label>Owner</Label>
              <Select value={ownerId} onValueChange={setOwnerId}>
                <SelectTrigger>
                  <SelectValue placeholder="No owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No owner</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="size-5">
                          <AvatarImage src={m.user.image ?? undefined} />
                          <AvatarFallback className="text-[10px]">
                            {m.user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        {m.user.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Release status */}
          <div className="space-y-2">
            <Label>Release status</Label>
            <Select value={releaseStatus} onValueChange={setReleaseStatus}>
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="pre_release">Pre-release</SelectItem>
                <SelectItem value="release_candidate">
                  Release Candidate
                </SelectItem>
                <SelectItem value="released">Released</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sprint members */}
          {members && members.length > 0 && (
            <div className="space-y-2">
              <Label>Members</Label>
              <div className="max-h-32 space-y-1 overflow-y-auto rounded border p-2">
                {members.map((m) => (
                  <label
                    key={m.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={selectedMembers.has(m.id)}
                      onCheckedChange={(checked) => {
                        setSelectedMembers((prev) => {
                          const next = new Set(prev);
                          if (checked) next.add(m.id);
                          else next.delete(m.id);
                          return next;
                        });
                      }}
                    />
                    <Avatar className="size-5">
                      <AvatarImage src={m.user.image ?? undefined} />
                      <AvatarFallback className="text-[10px]">
                        {m.user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{m.user.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

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
