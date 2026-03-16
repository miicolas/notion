import { useState } from "react"
import { useParams, useSearchParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { getIssues } from "@/lib/issues"
import { getLabels } from "@/lib/labels"
import { getMembers } from "@/lib/members"
import { IssueTable } from "@/components/issue-table"
import { IssueKanban } from "@/components/issue-kanban"
import { IssueForm } from "@/components/issue-form"
import { Button } from "@workspace/ui/components/button"
import { Plus, LayoutList, Kanban } from "lucide-react"

export function ProjectIssuesPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const view = searchParams.get("view") ?? "table"
  const [showForm, setShowForm] = useState(false)

  const { data: issues = [] } = useQuery({
    queryKey: ["issues", { projectId }],
    queryFn: () => getIssues({ projectId }),
  })
  const { data: labels = [] } = useQuery({
    queryKey: ["labels"],
    queryFn: getLabels,
  })
  const { data: members = [] } = useQuery({
    queryKey: ["members"],
    queryFn: getMembers,
  })

  function toggleView() {
    setSearchParams({ view: view === "kanban" ? "table" : "kanban" })
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
        projectId={projectId!}
        labels={labels}
        members={members}
        open={showForm}
        onOpenChange={setShowForm}
      />
    </div>
  )
}
