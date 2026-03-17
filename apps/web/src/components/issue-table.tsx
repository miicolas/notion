import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { LabelBadge } from "./label-badge";
import {
  AssigneeDropdown,
  PriorityDropdown,
  StatusDropdown,
} from "./issue-inline-edit";
import { CopyPromptButton } from "./copy-prompt-button";
import type { Issue } from "@/lib/types";

export function IssueTable({ issues }: { issues: Array<Issue> }) {
  const navigate = useNavigate();

  if (issues.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        No issues yet.
      </div>
    );
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
          <TableHead className="w-8"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {issues.map((issue) => (
          <TableRow
            key={issue.id}
            className="cursor-pointer"
            onClick={() => navigate(`/issues/${issue.id}`)}
          >
            <TableCell onClick={(e) => e.stopPropagation()}>
              <PriorityDropdown issueId={issue.id} value={issue.priority} />
            </TableCell>
            <TableCell onClick={(e) => e.stopPropagation()}>
              <StatusDropdown issueId={issue.id} value={issue.status} />
            </TableCell>
            <TableCell className="font-medium">{issue.title}</TableCell>
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
            <TableCell onClick={(e) => e.stopPropagation()}>
              <AssigneeDropdown issueId={issue.id} assignee={issue.assignee} />
            </TableCell>
            <TableCell className="text-muted-foreground">
              {issue.deadline
                ? new Date(issue.deadline).toLocaleDateString()
                : "\u2014"}
            </TableCell>
            <TableCell onClick={(e) => e.stopPropagation()}>
              <CopyPromptButton issue={issue} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
