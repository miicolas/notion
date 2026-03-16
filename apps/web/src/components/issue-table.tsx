import { Link } from "react-router-dom"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { IssuePriorityIcon, type Priority } from "./issue-priority-icon"
import { IssueStatusIcon, type IssueStatus } from "./issue-status-icon"
import { LabelBadge } from "./label-badge"
import { UserAvatar } from "./user-avatar"
import type { Issue } from "@/lib/types"

export function IssueTable({ issues }: { issues: Issue[] }) {
  if (issues.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        No issues yet.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-8"></TableHead>
          <TableHead className="w-8"></TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Labels</TableHead>
          <TableHead>Assignee</TableHead>
          <TableHead>Deadline</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {issues.map((issue) => (
          <TableRow key={issue.id}>
            <TableCell>
              <IssuePriorityIcon priority={issue.priority as Priority} />
            </TableCell>
            <TableCell>
              <IssueStatusIcon status={issue.status as IssueStatus} />
            </TableCell>
            <TableCell>
              <Link
                to={`/issues/${issue.id}`}
                className="font-medium hover:underline"
              >
                {issue.title}
              </Link>
            </TableCell>
            <TableCell>
              <div className="flex gap-1">
                {issue.issueLabels?.map((il) => (
                  <LabelBadge
                    key={il.label.id}
                    name={il.label.name}
                    color={il.label.color}
                  />
                ))}
              </div>
            </TableCell>
            <TableCell>
              {issue.assignee ? (
                <div className="flex items-center gap-2">
                  <UserAvatar name={issue.assignee.user.name} image={issue.assignee.user.image} />
                  <span className="text-sm">{issue.assignee.user.name}</span>
                </div>
              ) : (
                <span className="text-muted-foreground">&mdash;</span>
              )}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {issue.deadline
                ? new Date(issue.deadline).toLocaleDateString()
                : "\u2014"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
