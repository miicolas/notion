import { CheckCircle2, Circle, CircleDot, Loader, XCircle } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

const statusConfig = {
  backlog: { icon: Circle, color: "text-muted-foreground", label: "Backlog" },
  todo: { icon: CircleDot, color: "text-blue-500", label: "Todo" },
  in_progress: { icon: Loader, color: "text-yellow-500", label: "In Progress" },
  done: { icon: CheckCircle2, color: "text-green-500", label: "Done" },
  cancelled: { icon: XCircle, color: "text-red-500", label: "Cancelled" },
} as const;

export type IssueStatus = keyof typeof statusConfig;

export function IssueStatusIcon({
  status,
  className,
}: {
  status: IssueStatus;
  className?: string;
}) {
  const config = statusConfig[status];
  const Icon = config.icon;
  return <Icon className={cn("size-4", config.color, className)} />;
}

export { statusConfig };
