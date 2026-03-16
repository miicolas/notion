import * as React from "react"
import { Button } from "@workspace/ui/components/button"
import { Textarea } from "@workspace/ui/components/textarea"
import { createComment } from "@/lib/comments"
import { useRouter } from "@tanstack/react-router"

export function CommentForm({ issueId }: { issueId: string }) {
  const router = useRouter()
  const [content, setContent] = React.useState("")
  const [pending, setPending] = React.useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setPending(true)
    await createComment({ data: { issueId, content } })
    setContent("")
    setPending(false)
    router.invalidate()
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
        <Button type="submit" size="sm" disabled={pending || !content.trim()}>
          {pending ? "Posting..." : "Comment"}
        </Button>
      </div>
    </form>
  )
}
