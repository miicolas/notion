import { createFileRoute, Link } from "@tanstack/react-router"
import { getProjects } from "@/lib/projects"
import { getIssues } from "@/lib/issues"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { FolderKanban, CheckCircle2, Clock, AlertTriangle } from "lucide-react"

export const Route = createFileRoute("/_authed/")({
  loader: async () => {
    try {
      const [projects, issues] = await Promise.all([
        getProjects(),
        getIssues(),
      ])
      return { projects, issues }
    } catch {
      return { projects: [], issues: [] }
    }
  },
  component: DashboardPage,
})

function DashboardPage() {
  const { projects, issues } = Route.useLoaderData()

  const activeProjects = projects.filter((p: any) => p.status === "active")
  const myIssues = issues as any[]
  const todoCount = myIssues.filter(
    (i) => i.status === "todo" || i.status === "in_progress",
  ).length
  const doneCount = myIssues.filter((i) => i.status === "done").length
  const urgentCount = myIssues.filter(
    (i) => i.priority === "urgent" || i.priority === "high",
  ).length

  return (
    <>
      <PageHeader title="Dashboard" />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <FolderKanban className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeProjects.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todoCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{doneCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Urgent/High</CardTitle>
              <AlertTriangle className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{urgentCount}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Projects</CardTitle>
            </CardHeader>
            <CardContent>
              {activeProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">No projects yet.</p>
              ) : (
                <div className="space-y-2">
                  {activeProjects.slice(0, 5).map((project: any) => (
                    <Link
                      key={project.id}
                      to="/projects/$projectId"
                      params={{ projectId: project.id }}
                      search={{ view: "table" }}
                      className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted"
                    >
                      <span className="text-sm font-medium">{project.name}</span>
                      <Badge variant="secondary">{project.issues?.length ?? 0} issues</Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Issues</CardTitle>
            </CardHeader>
            <CardContent>
              {myIssues.length === 0 ? (
                <p className="text-sm text-muted-foreground">No issues yet.</p>
              ) : (
                <div className="space-y-2">
                  {myIssues.slice(0, 5).map((issue: any) => (
                    <Link
                      key={issue.id}
                      to="/issues/$issueId"
                      params={{ issueId: issue.id }}
                      className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted"
                    >
                      <span className="text-sm">{issue.title}</span>
                      <Badge variant="outline">{issue.status.replace("_", " ")}</Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
