import { useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { ArrowLeft, Paperclip, Pencil, Trash2, X } from "lucide-react";
import { Separator } from "@workspace/ui/components/separator";
import { deleteIssue, getIssue } from "@/lib/issues";
import { getLabels } from "@/lib/labels";
import { getMembers } from "@/lib/members";
import { deleteAsset, uploadFile } from "@/lib/assets";
import { IssueForm } from "@/components/issue-form";
import { CommentList } from "@/components/comment-list";
import { CommentForm } from "@/components/comment-form";
import { AssetDisplay } from "@/components/asset-display";
import {
  AssigneeDropdown,
  PriorityDropdown,
  StatusDropdown,
} from "@/components/issue-inline-edit";
import { LabelBadge } from "@/components/label-badge";
import { CopyPromptButton } from "@/components/copy-prompt-button";

export function IssueDetailPage() {
  const { issueId } = useParams<{ issueId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showEdit, setShowEdit] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadFile(file, { issueId: issue?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issue", issueId] });
    },
  });

  const deleteAssetMutation = useMutation({
    mutationFn: (assetId: string) => deleteAsset(assetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issue", issueId] });
    },
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
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">
            Attachments ({issue.issueAssets?.length ?? 0})
          </h2>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  Array.from(e.target.files).forEach((file) =>
                    uploadMutation.mutate(file),
                  );
                }
                e.target.value = "";
              }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
            >
              <Paperclip className="mr-1.5 size-4" />
              {uploadMutation.isPending ? "Uploading..." : "Add file"}
            </Button>
          </div>
        </div>
        {issue.issueAssets && issue.issueAssets.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {issue.issueAssets.map(({ asset }) => (
              <div key={asset.id} className="group relative">
                <AssetDisplay asset={asset} />
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Delete this attachment?")) {
                      deleteAssetMutation.mutate(asset.id);
                    }
                  }}
                  className="absolute -top-2 -right-2 hidden rounded-full bg-red-500 p-0.5 text-white group-hover:block"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No attachments.</p>
        )}
      </div>

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
