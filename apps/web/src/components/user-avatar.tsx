import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import { cn } from "@workspace/ui/lib/utils"

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function UserAvatar({
  name,
  image,
  className,
}: {
  name: string
  image?: string | null
  className?: string
}) {
  return (
    <Avatar className={cn("size-6", className)}>
      <AvatarImage src={image ?? undefined} />
      <AvatarFallback className="text-xs">{getInitials(name)}</AvatarFallback>
    </Avatar>
  )
}
