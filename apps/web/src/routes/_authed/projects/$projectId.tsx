import { createFileRoute, Outlet } from "@tanstack/react-router"
import { getProject } from "@/lib/projects"

export const Route = createFileRoute("/_authed/projects/$projectId")({
  loader: ({ params }) => getProject({ data: params.projectId }),
  component: ProjectLayout,
})

function ProjectLayout() {
  const project = Route.useLoaderData()

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b px-4 py-3">
        <h1 className="text-lg font-semibold">{project.name}</h1>
        {project.description && (
          <p className="text-sm text-muted-foreground">{project.description}</p>
        )}
      </div>
      <Outlet />
    </div>
  )
}
