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
import { createProject, updateProject } from "@/lib/projects"
import { useRouter } from "@tanstack/react-router"
import type { Client, Project } from "@/lib/types"

export function ProjectForm({
  project,
  clients,
  open,
  onOpenChange,
}: {
  project?: Project | null
  clients: Client[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [pending, setPending] = React.useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || undefined,
      clientId: (formData.get("clientId") as string) || undefined,
      status: (formData.get("status") as string) || "active",
      startDate: (formData.get("startDate") as string) || undefined,
      endDate: (formData.get("endDate") as string) || undefined,
    }

    if (project) {
      await updateProject({ data: { id: project.id, ...data } })
    } else {
      await createProject({ data })
    }
    setPending(false)
    onOpenChange(false)
    router.invalidate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{project ? "Edit project" : "New project"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" name="name" required defaultValue={project?.name ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={project?.description ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientId">Client</Label>
            <Select name="clientId" defaultValue={project?.clientId ?? ""}>
              <SelectTrigger>
                <SelectValue placeholder="No client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue={project?.status ?? "active"}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start date</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                defaultValue={project?.startDate ? new Date(project.startDate).toISOString().split("T")[0] : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End date</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                defaultValue={project?.endDate ? new Date(project.endDate).toISOString().split("T")[0] : ""}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : project ? "Save" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
