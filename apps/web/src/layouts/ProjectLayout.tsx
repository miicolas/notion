import { Outlet, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { getProject } from "@/lib/projects"

export function ProjectLayout() {
  const { projectId } = useParams<{ projectId: string }>()

  const { data: project, isPending } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProject(projectId!),
    enabled: !!projectId,
  })

  if (isPending || !project) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

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
