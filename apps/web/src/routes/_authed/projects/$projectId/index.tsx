import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"
import { getIssues } from "@/lib/issues"
import { getLabels } from "@/lib/labels"
import { getMembers } from "@/lib/members"
import { IssueTable } from "@/components/issue-table"
import { IssueKanban } from "@/components/issue-kanban"
import { IssueForm } from "@/components/issue-form"
import { Button } from "@workspace/ui/components/button"
import { Plus, LayoutList, Kanban } from "lucide-react"
import { useRouter } from "@tanstack/react-router"

export const Route = createFileRoute("/_authed/projects/$projectId/")({
  validateSearch: (search: Record<string, unknown>) => ({
    view: (search.view as string) ?? "table",
  }),
  loader: async ({ params }) => {
    const [issues, labels, members] = await Promise.all([
      getIssues({ data: { projectId: params.projectId } }),
      getLabels(),
      getMembers(),
    ])
    return { issues, labels, members }
  },
  component: ProjectIssuesPage,
})

function ProjectIssuesPage() {
  const { projectId } = Route.useParams()
  const { view } = Route.useSearch()
  const { issues, labels, members } = Route.useLoaderData()
  const router = useRouter()
  const [showForm, setShowForm] = React.useState(false)

  function toggleView() {
    router.navigate({
      to: ".",
      search: { view: view === "kanban" ? "table" : "kanban" },
    })
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Issues</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={toggleView}>
            {view === "kanban" ? (
              <>
                <LayoutList className="mr-1 size-4" />
                Table
              </>
            ) : (
              <>
                <Kanban className="mr-1 size-4" />
                Kanban
              </>
            )}
          </Button>
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="mr-1 size-4" />
            New issue
          </Button>
        </div>
      </div>

      {view === "kanban" ? (
        <IssueKanban issues={issues} />
      ) : (
        <IssueTable issues={issues} />
      )}

      <IssueForm
        projectId={projectId}
        labels={labels}
        members={members}
        open={showForm}
        onOpenChange={setShowForm}
      />
    </div>
  )
}
