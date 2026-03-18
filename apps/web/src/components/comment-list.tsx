import { UserAvatar } from "./user-avatar";
import { AssetDisplay } from "./asset-display";
import type { Comment } from "@/lib/types";

export function CommentList({ comments }: { comments: Array<Comment> }) {
  if (comments.length === 0) {
    return <p className="text-sm text-muted-foreground">No comments yet.</p>;
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div key={comment.id} className="flex gap-3">
          <UserAvatar
            name={comment.author.name}
            image={comment.author.image}
            className="size-8"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{comment.author.name}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(comment.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
            {comment.commentAssets && comment.commentAssets.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {comment.commentAssets.map(({ asset }) => (
                  <AssetDisplay key={asset.id} asset={asset} />
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
