import * as React from "react"
import { Button } from "@workspace/ui/components/button"
import { Textarea } from "@workspace/ui/components/textarea"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createComment } from "@/lib/comments"

export function CommentForm({ issueId }: { issueId: string }) {
  const queryClient = useQueryClient()
  const [content, setContent] = React.useState("")

  const mutation = useMutation({
    mutationFn: () => createComment({ issueId, content }),
    onSuccess: () => {
      setContent("")
      queryClient.invalidateQueries({ queryKey: ["issue", issueId] })
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    mutation.mutate()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <Textarea
        placeholder="Write a comment..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
      />
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={mutation.isPending || !content.trim()}>
          {mutation.isPending ? "Posting..." : "Comment"}
        </Button>
      </div>
    </form>
  )
}
