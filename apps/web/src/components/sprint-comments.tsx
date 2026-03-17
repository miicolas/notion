import * as React from "react";
import { format } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { Textarea } from "@workspace/ui/components/textarea";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { Badge } from "@workspace/ui/components/badge";
import { Pencil, Send, Trash2 } from "lucide-react";
import type { SprintComment } from "@/lib/types";
import {
  createSprintComment,
  deleteSprintComment,
  getSprintComments,
  updateSprintComment,
} from "@/lib/sprints";

export function SprintComments({
  sprintId,
  currentUserId,
}: {
  sprintId: string;
  currentUserId?: string;
}) {
  const queryClient = useQueryClient();
  const [newContent, setNewContent] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editContent, setEditContent] = React.useState("");

  const { data: comments = [] } = useQuery({
    queryKey: ["sprint-comments", sprintId],
    queryFn: () => getSprintComments(sprintId),
  });

  const createMutation = useMutation({
    mutationFn: createSprintComment,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["sprint-comments", sprintId],
      });
      setNewContent("");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      updateSprintComment(id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["sprint-comments", sprintId],
      });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSprintComment,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["sprint-comments", sprintId],
      });
    },
  });

  function handleCreate() {
    if (!newContent.trim()) return;
    createMutation.mutate({ sprintId, content: newContent });
  }

  function startEdit(comment: SprintComment) {
    setEditingId(comment.id);
    setEditContent(comment.content);
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold">Status updates</h4>

      {comments.length === 0 && (
        <p className="text-xs text-muted-foreground">No updates yet.</p>
      )}

      <div className="space-y-3">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className={`rounded-lg border p-3 ${
              comment.type === "retrospective"
                ? "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950"
                : ""
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Avatar className="size-6">
                  <AvatarImage src={comment.author.image ?? undefined} />
                  <AvatarFallback className="text-[10px]">
                    {comment.author.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">
                  {comment.author.name}
                </span>
                {comment.type === "retrospective" && (
                  <Badge variant="secondary" className="text-[10px]">
                    Retrospective
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {format(new Date(comment.createdAt), "MMM d, HH:mm")}
                </span>
              </div>
              {currentUserId === comment.author.id && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => startEdit(comment)}
                  >
                    <Pencil className="size-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => deleteMutation.mutate(comment.id)}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              )}
            </div>
            {editingId === comment.id ? (
              <div className="mt-2 space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      updateMutation.mutate({
                        id: comment.id,
                        content: editContent,
                      })
                    }
                    disabled={updateMutation.isPending}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="mt-1 text-sm">{comment.content}</p>
            )}
          </div>
        ))}
      </div>

      {/* New comment */}
      <div className="flex gap-2">
        <Textarea
          placeholder="Add a status update..."
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          rows={2}
          className="flex-1"
        />
        <Button
          size="icon"
          onClick={handleCreate}
          disabled={createMutation.isPending || !newContent.trim()}
        >
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}
