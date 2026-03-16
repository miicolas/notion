import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { createIssue, updateIssue } from "@/lib/issues"
import { useRouter } from "@tanstack/react-router"
import { statusConfig } from "./issue-status-icon"
import { priorityConfig } from "./issue-priority-icon"
import { UserAvatar } from "./user-avatar"
import type { Member, LabelItem, Issue } from "@/lib/types"

export function IssueForm({
  issue,
  projectId,
  labels,
  members,
  open,
  onOpenChange,
}: {
  issue?: Issue | null
  projectId: string
  labels: LabelItem[]
  members: Member[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [pending, setPending] = React.useState(false)
  const [selectedLabels, setSelectedLabels] = React.useState<string[]>(
    issue?.issueLabels?.map((il) => il.label.id) ?? [],
  )

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    const formData = new FormData(e.currentTarget)
    const data = {
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || undefined,
      status: formData.get("status") as string,
      priority: formData.get("priority") as string,
      assigneeId: (formData.get("assigneeId") as string) || undefined,
      deadline: (formData.get("deadline") as string) || undefined,
      labelIds: selectedLabels,
    }

    if (issue) {
      await updateIssue({ data: { id: issue.id, ...data } })
    } else {
      await createIssue({ data: { projectId, ...data } })
    }
    setPending(false)
    onOpenChange(false)
    router.invalidate()
  }

  function toggleLabel(labelId: string) {
    setSelectedLabels((prev) =>
      prev.includes(labelId)
        ? prev.filter((id) => id !== labelId)
        : [...prev, labelId],
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{issue ? "Edit issue" : "New issue"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              name="title"
              required
              defaultValue={issue?.title ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={issue?.description ?? ""}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select name="status" defaultValue={issue?.status ?? "backlog"}>
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
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                name="priority"
                defaultValue={issue?.priority ?? "no_priority"}
              >
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
            </div>
          </div>
          <div className="space-y-2">
            <Label>Assignee</Label>
            <Select
              name="assigneeId"
              defaultValue={issue?.assigneeId ?? ""}
            >
              <SelectTrigger>
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    <div className="flex items-center gap-2">
                      <UserAvatar name={m.user.name} image={m.user.image} className="size-5" />
                      {m.user.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline</Label>
            <Input
              id="deadline"
              name="deadline"
              type="date"
              defaultValue={
                issue?.deadline
                  ? new Date(issue.deadline).toISOString().split("T")[0]
                  : ""
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Labels</Label>
            <div className="flex flex-wrap gap-2">
              {labels.map((label) => (
                <button
                  key={label.id}
                  type="button"
                  onClick={() => toggleLabel(label.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                    selectedLabels.includes(label.id)
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
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : issue ? "Save" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
