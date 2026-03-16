import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { Calendar } from "@workspace/ui/components/calendar";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RiCalendarLine } from "@remixicon/react";
import { createIssue, updateIssue } from "@/lib/issues";
import { statusConfig } from "./issue-status-icon";
import { priorityConfig } from "./issue-priority-icon";
import { UserAvatar } from "./user-avatar";
import { cn } from "@workspace/ui/lib/utils";
import type { Member, LabelItem, Issue, Sprint } from "@/lib/types";

const issueSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.string(),
  priority: z.string(),
  assigneeId: z.string().optional(),
  sprintId: z.string().optional(),
  deadline: z.date().optional(),
  labelIds: z.array(z.string()),
});

type IssueFormValues = z.infer<typeof issueSchema>;

export function IssueForm({
  issue,
  projectId,
  labels,
  members,
  sprints = [],
  open,
  onOpenChange,
}: {
  issue?: Issue | null;
  projectId: string;
  labels: LabelItem[];
  members: Member[];
  sprints?: Sprint[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const form = useForm<IssueFormValues>({
    resolver: standardSchemaResolver(issueSchema),
    defaultValues: {
      title: issue?.title ?? "",
      description: issue?.description ?? "",
      status: issue?.status ?? "backlog",
      priority: issue?.priority ?? "no_priority",
      assigneeId: issue?.assigneeId ?? "",
      sprintId: issue?.sprintId ?? "",
      deadline: issue?.deadline ? new Date(issue.deadline) : undefined,
      labelIds: issue?.issueLabels?.map((il) => il.label.id) ?? [],
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        title: issue?.title ?? "",
        description: issue?.description ?? "",
        status: issue?.status ?? "backlog",
        priority: issue?.priority ?? "no_priority",
        assigneeId: issue?.assigneeId ?? "",
        sprintId: issue?.sprintId ?? "",
        deadline: issue?.deadline ? new Date(issue.deadline) : undefined,
        labelIds: issue?.issueLabels?.map((il) => il.label.id) ?? [],
      });
    }
  }, [open, issue]);

  const mutation = useMutation({
    mutationFn: (data: IssueFormValues) => {
      const payload = {
        title: data.title,
        description: data.description || undefined,
        status: data.status,
        priority: data.priority,
        assigneeId: data.assigneeId || undefined,
        deadline: data.deadline
          ? format(data.deadline, "yyyy-MM-dd")
          : undefined,
        labelIds: data.labelIds,
        sprintId: data.sprintId || undefined,
      };
      if (issue) return updateIssue({ id: issue.id, ...payload });
      return createIssue({ projectId, ...payload } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      queryClient.invalidateQueries({ queryKey: ["issue"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{issue ? "Edit issue" : "New issue"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" {...form.register("title")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...form.register("description")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusConfig).map(([key, cfg]) => (
                        <SelectItem key={key} value={key}>
                          {cfg.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Controller
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(priorityConfig).map(([key, cfg]) => (
                        <SelectItem key={key} value={key}>
                          {cfg.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Assignee</Label>
            <Controller
              control={form.control}
              name="assigneeId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        <div className="flex items-center gap-2">
                          <UserAvatar
                            name={m.user.name}
                            image={m.user.image}
                            className="size-5"
                          />
                          {m.user.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          {sprints.length > 0 && (
            <div className="space-y-2">
              <Label>Sprint</Label>
              <Controller
                control={form.control}
                name="sprintId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="No sprint" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No sprint</SelectItem>
                      {sprints
                        .filter(
                          (s) =>
                            s.status === "active" || s.status === "planned",
                        )
                        .map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name} ({s.status})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label>Deadline</Label>
            <Controller
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.value && "text-muted-foreground",
                      )}
                    >
                      <RiCalendarLine className="mr-2 size-4" />
                      {field.value ? format(field.value, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label>Labels</Label>
            <Controller
              control={form.control}
              name="labelIds"
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {labels.map((label) => (
                    <button
                      key={label.id}
                      type="button"
                      onClick={() => {
                        const next = field.value.includes(label.id)
                          ? field.value.filter((id) => id !== label.id)
                          : [...field.value, label.id];
                        field.onChange(next);
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                        field.value.includes(label.id)
                          ? "border-transparent bg-primary text-primary-foreground"
                          : "border-border"
                      }`}
                    >
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: label.color }}
                      />
                      {label.name}
                    </button>
                  ))}
                  {labels.length === 0 && (
                    <span className="text-sm text-muted-foreground">
                      No labels created yet
                    </span>
                  )}
                </div>
              )}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : issue ? "Save" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
