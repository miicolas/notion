import * as React from "react"
import { createFileRoute, Link, useRouter } from "@tanstack/react-router"
import { getIssue, deleteIssue } from "@/lib/issues"
import { getLabels } from "@/lib/labels"
import { getMembers } from "@/lib/members"
import { IssueForm } from "@/components/issue-form"
import { CommentList } from "@/components/comment-list"
import { CommentForm } from "@/components/comment-form"
import { IssueStatusIcon, statusConfig, type IssueStatus } from "@/components/issue-status-icon"
import { IssuePriorityIcon, priorityConfig, type Priority } from "@/components/issue-priority-icon"
import { LabelBadge } from "@/components/label-badge"
import { Button } from "@workspace/ui/components/button"

import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import { ArrowLeft, Pencil, Trash2 } from "lucide-react"
import { Separator } from "@workspace/ui/components/separator"

export const Route = createFileRoute("/_authed/issues/$issueId")({
  loader: async ({ params }) => {
    const [issue, labels, members] = await Promise.all([
      getIssue({ data: params.issueId }),
      getLabels(),
      getMembers(),
    ])
    return { issue, labels, members }
  },
  component: IssueDetailPage,
})

function IssueDetailPage() {
  const { issue, labels, members } = Route.useLoaderData()
  const router = useRouter()
  const [showEdit, setShowEdit] = React.useState(false)

  async function handleDelete() {
    if (!confirm("Delete this issue?")) return
    await deleteIssue({ data: issue.id })
    router.history.back()
  }

  const statusCfg = statusConfig[issue.status as IssueStatus]
  const priorityCfg = priorityConfig[issue.priority as Priority]

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.history.back()}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{issue.title}</h1>
          {issue.project && (
            <Link
              to="/projects/$projectId"
              params={{ projectId: issue.project.id }}
              search={{ view: "table" }}
              className="text-sm text-muted-foreground hover:underline"
            >
              {issue.project.name}
            </Link>
          )}
        </div>
        <Button variant="outline" onClick={() => setShowEdit(true)}>
          <Pencil className="mr-2 size-4" />
          Edit
        </Button>
        <Button variant="destructive" onClick={handleDelete}>
          <Trash2 className="mr-2 size-4" />
          Delete
        </Button>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <IssueStatusIcon status={issue.status as IssueStatus} />
          <span className="text-sm">{statusCfg?.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <IssuePriorityIcon priority={issue.priority as Priority} />
          <span className="text-sm">{priorityCfg?.label}</span>
        </div>
        {issue.assignee && (
          <div className="flex items-center gap-2">
            <Avatar className="size-6">
              <AvatarImage src={issue.assignee.user.image ?? undefined} />
              <AvatarFallback className="text-xs">
                {issue.assignee.user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">{issue.assignee.user.name}</span>
          </div>
        )}
        {issue.deadline && (
          <span className="text-sm text-muted-foreground">
            Due {new Date(issue.deadline).toLocaleDateString()}
          </span>
        )}
      </div>

      {issue.issueLabels?.length > 0 && (
        <div className="flex gap-2">
          {issue.issueLabels.map((il: any) => (
            <LabelBadge key={il.label.id} name={il.label.name} color={il.label.color} />
          ))}
        </div>
      )}

      {issue.description && (
        <div>
          <h2 className="mb-2 font-semibold">Description</h2>
          <p className="text-sm whitespace-pre-wrap">{issue.description}</p>
        </div>
      )}

      <Separator />

      <div>
        <h2 className="mb-4 font-semibold">
          Comments ({issue.comments?.length ?? 0})
        </h2>
        <CommentList comments={issue.comments ?? []} />
        <div className="mt-4">
          <CommentForm issueId={issue.id} />
        </div>
      </div>

      <IssueForm
        issue={issue}
        projectId={issue.projectId}
        labels={labels}
        members={members}
        open={showEdit}
        onOpenChange={setShowEdit}
      />
    </div>
  )
}
