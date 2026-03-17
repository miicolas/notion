import {
  Minus,
  Signal,
  SignalHigh,
  SignalLow,
  SignalMedium,
} from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

const priorityConfig = {
  urgent: { icon: SignalHigh, color: "text-red-500", label: "Urgent" },
  high: { icon: Signal, color: "text-orange-500", label: "High" },
  medium: { icon: SignalMedium, color: "text-yellow-500", label: "Medium" },
  low: { icon: SignalLow, color: "text-blue-500", label: "Low" },
  no_priority: {
    icon: Minus,
    color: "text-muted-foreground",
    label: "No priority",
  },
} as const;

export type Priority = keyof typeof priorityConfig;

export function IssuePriorityIcon({
  priority,
  className,
}: {
  priority: Priority;
  className?: string;
}) {
  const config = priorityConfig[priority];
  const Icon = config.icon;
  return <Icon className={cn("size-4", config.color, className)} />;
}

export { priorityConfig };
