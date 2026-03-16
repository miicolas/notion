import { Link } from "react-router-dom"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { LabelBadge } from "./label-badge"
import { StatusDropdown, PriorityDropdown, AssigneeDropdown } from "./issue-inline-edit"
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
          <TableHead className="w-8">Priority</TableHead>
          <TableHead className="w-8">Status</TableHead>
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
              <PriorityDropdown issueId={issue.id} value={issue.priority} />
            </TableCell>
            <TableCell>
              <StatusDropdown issueId={issue.id} value={issue.status} />
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
              <AssigneeDropdown issueId={issue.id} assignee={issue.assignee} />
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
