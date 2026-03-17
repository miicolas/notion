import { useSortable } from "@dnd-kit/sortable";
import { GripVertical, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { WIDGET_REGISTRY } from "./widget-registry";
import type { DashboardStats, WidgetConfig } from "@/lib/types";

const sizeClasses: Record<WidgetConfig["size"], string> = {
  sm: "col-span-1",
  md: "md:col-span-2 col-span-1",
  lg: "md:col-span-3 col-span-1",
};

export function DashboardWidgetCard({
  config,
  stats,
  onRemove,
  isDragOverlay,
}: {
  config: WidgetConfig;
  stats: DashboardStats;
  onRemove: (id: string) => void;
  isDragOverlay?: boolean;
}) {
  const def = WIDGET_REGISTRY[config.type];
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: config.id });

  // Only use translate, never scale — prevents deformation across different col-spans
  const style = {
    transform: transform
      ? `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)`
      : undefined,
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!def) return null;

  const WidgetComponent = def.component;

  if (isDragOverlay) {
    return (
      <Card className="h-full shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <GripVertical className="size-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">{def.label}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <WidgetComponent stats={stats} />
        </CardContent>
      </Card>
    );
  }

  return (
    <div ref={setNodeRef} style={style} className={sizeClasses[config.size]}>
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <button
              className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="size-4" />
            </button>
            <CardTitle className="text-sm font-medium">{def.label}</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={() => onRemove(config.id)}
          >
            <X className="size-3.5" />
          </Button>
        </CardHeader>
        <CardContent>
          <WidgetComponent stats={stats} />
        </CardContent>
      </Card>
    </div>
  );
}
