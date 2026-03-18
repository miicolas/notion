import { useRef } from "react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { Button } from "@workspace/ui/components/button";
import { Textarea } from "@workspace/ui/components/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Paperclip, X } from "lucide-react";
import { createComment } from "@/lib/comments";
import { useFileUpload } from "@/hooks/use-file-upload";

const commentSchema = z.object({
  content: z.string().min(1),
});

type CommentFormValues = z.infer<typeof commentSchema>;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CommentForm({ issueId }: { issueId: string }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { pendingFiles, addFiles, removeFile, uploadAll, isUploading, reset } =
    useFileUpload();

  const form = useForm<CommentFormValues>({
    resolver: standardSchemaResolver(commentSchema),
    defaultValues: { content: "" },
  });

  const mutation = useMutation({
    mutationFn: async (data: CommentFormValues) => {
      let assetIds: Array<string> | undefined;

      if (pendingFiles.length > 0) {
        const assets = await uploadAll();
        assetIds = assets.map((a) => a.id);
      }

      return createComment({
        issueId,
        content: data.content,
        assetIds,
      });
    },
    onSuccess: () => {
      form.reset();
      reset();
      queryClient.invalidateQueries({ queryKey: ["issue", issueId] });
    },
  });

  return (
    <form
      onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
      className="flex flex-col gap-2"
    >
      <Textarea
        placeholder="Write a comment..."
        {...form.register("content")}
        rows={3}
      />

      {pendingFiles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {pendingFiles.map((pf) => (
            <div
              key={pf.id}
              className="bg-muted flex items-center gap-2 rounded-md px-3 py-1.5 text-sm"
            >
              {pf.preview ? (
                <img
                  src={pf.preview}
                  alt={pf.file.name}
                  className="size-8 rounded object-cover"
                />
              ) : null}
              <span className="max-w-[150px] truncate">{pf.file.name}</span>
              <span className="text-muted-foreground text-xs">
                {formatFileSize(pf.file.size)}
              </span>
              <button
                type="button"
                onClick={() => removeFile(pf.id)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip className="mr-1.5 size-4" />
          Attach
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={
            mutation.isPending || isUploading || !form.watch("content").trim()
          }
        >
          {mutation.isPending || isUploading ? "Posting..." : "Comment"}
        </Button>
      </div>
    </form>
  );
}
