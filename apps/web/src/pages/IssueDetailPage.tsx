import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getIssue, deleteIssue } from "@/lib/issues";
import { getLabels } from "@/lib/labels";
import { getMembers } from "@/lib/members";
import { IssueForm } from "@/components/issue-form";
import { CommentList } from "@/components/comment-list";
import { CommentForm } from "@/components/comment-form";
import {
  StatusDropdown,
  PriorityDropdown,
  AssigneeDropdown,
} from "@/components/issue-inline-edit";
import { LabelBadge } from "@/components/label-badge";
import { CopyPromptButton } from "@/components/copy-prompt-button";
import { Button } from "@workspace/ui/components/button";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Separator } from "@workspace/ui/components/separator";

export function IssueDetailPage() {
  const { issueId } = useParams<{ issueId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showEdit, setShowEdit] = useState(false);

  const { data: issue, isPending } = useQuery({
    queryKey: ["issue", issueId],
    queryFn: () => getIssue(issueId!),
    enabled: !!issueId,
  });
  const { data: labels = [] } = useQuery({
    queryKey: ["labels"],
    queryFn: getLabels,
  });
  const { data: members = [] } = useQuery({
    queryKey: ["members"],
    queryFn: getMembers,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteIssue(issue!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      navigate(-1);
    },
  });

  if (isPending || !issue) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  function handleDelete() {
    if (!confirm("Delete this issue?")) return;
    deleteMutation.mutate();
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{issue.title}</h1>
          {issue.project && (
            <Link
              to={`/projects/${issue.project.id}?view=table`}
              className="text-sm text-muted-foreground hover:underline"
            >
              {issue.project.name}
            </Link>
          )}
        </div>
        <CopyPromptButton issue={issue} showLabel />
        <Button variant="outline" onClick={() => setShowEdit(true)}>
          <Pencil className="mr-2 size-4" />
          Edit
        </Button>
        <Button variant="destructive" onClick={handleDelete}>
          <Trash2 className="mr-2 size-4" />
          Delete
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <StatusDropdown issueId={issue.id} value={issue.status} />
        <PriorityDropdown issueId={issue.id} value={issue.priority} />
        <AssigneeDropdown issueId={issue.id} assignee={issue.assignee} />
        {issue.deadline && (
          <span className="text-sm text-muted-foreground">
            Due {new Date(issue.deadline).toLocaleDateString()}
          </span>
        )}
      </div>

      {issue.issueLabels && issue.issueLabels.length > 0 && (
        <div className="flex gap-2">
          {issue.issueLabels.map((il: any) => (
            <LabelBadge
              key={il.label.id}
              name={il.label.name}
              color={il.label.color}
            />
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
        projectId={issue.projectId!}
        labels={labels}
        members={members}
        open={showEdit}
        onOpenChange={setShowEdit}
      />
    </div>
  );
}
