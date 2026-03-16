import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import type { Comment } from "@/lib/types"

export function CommentList({ comments }: { comments: Comment[] }) {
  if (comments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No comments yet.</p>
    )
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div key={comment.id} className="flex gap-3">
          <Avatar className="size-8">
            <AvatarImage src={comment.author.image ?? undefined} />
            <AvatarFallback className="text-xs">
              {comment.author.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{comment.author.name}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(comment.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
