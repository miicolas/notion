import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { Button } from "@workspace/ui/components/button";
import { Textarea } from "@workspace/ui/components/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createComment } from "@/lib/comments";

const commentSchema = z.object({
  content: z.string().min(1),
});

type CommentFormValues = z.infer<typeof commentSchema>;

export function CommentForm({ issueId }: { issueId: string }) {
  const queryClient = useQueryClient();
  const form = useForm<CommentFormValues>({
    resolver: standardSchemaResolver(commentSchema),
    defaultValues: { content: "" },
  });

  const mutation = useMutation({
    mutationFn: (data: CommentFormValues) =>
      createComment({ issueId, content: data.content }),
    onSuccess: () => {
      form.reset();
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
      <div className="flex justify-end">
        <Button
          type="submit"
          size="sm"
          disabled={mutation.isPending || !form.watch("content").trim()}
        >
          {mutation.isPending ? "Posting..." : "Comment"}
        </Button>
      </div>
    </form>
  );
}
