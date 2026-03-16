import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"
import { getProjects } from "@/lib/projects"
import { getClients } from "@/lib/clients"
import { ProjectTable } from "@/components/project-table"
import { ProjectForm } from "@/components/project-form"
import { Button } from "@workspace/ui/components/button"
import { Plus } from "lucide-react"

export const Route = createFileRoute("/_authed/projects/")({
  loader: async () => {
    const [projects, clients] = await Promise.all([getProjects(), getClients()])
    return { projects, clients }
  },
  component: ProjectsPage,
})

function ProjectsPage() {
  const { projects, clients } = Route.useLoaderData()
  const [showForm, setShowForm] = React.useState(false)

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 size-4" />
          New project
        </Button>
      </div>
      <ProjectTable projects={projects} />
      <ProjectForm clients={clients} open={showForm} onOpenChange={setShowForm} />
    </div>
  )
}
