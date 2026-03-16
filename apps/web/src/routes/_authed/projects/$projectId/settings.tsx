import * as React from "react"
import { createFileRoute, useRouter } from "@tanstack/react-router"
import { deleteProject } from "@/lib/projects"
import { getClients } from "@/lib/clients"
import { ProjectForm } from "@/components/project-form"
import { Button } from "@workspace/ui/components/button"
import { Trash2 } from "lucide-react"

export const Route = createFileRoute(
  "/_authed/projects/$projectId/settings",
)({
  loader: () => getClients(),
  component: ProjectSettingsPage,
})

function ProjectSettingsPage() {
  const clients = Route.useLoaderData()
  const router = useRouter()
  const { projectId } = Route.useParams()
  const [showEdit, setShowEdit] = React.useState(false)

  async function handleDelete() {
    if (!confirm("Delete this project and all its issues?")) return
    await deleteProject({ data: projectId })
    router.navigate({ to: "/projects" })
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <h2 className="font-semibold">Project Settings</h2>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setShowEdit(true)}>
          Edit project
        </Button>
        <Button variant="destructive" onClick={handleDelete}>
          <Trash2 className="mr-2 size-4" />
          Delete project
        </Button>
      </div>
      <ProjectForm clients={clients} open={showEdit} onOpenChange={setShowEdit} />
    </div>
  )
}
