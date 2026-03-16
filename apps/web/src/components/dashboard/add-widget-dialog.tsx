import { Check, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import type { WidgetConfig } from "@/lib/types";
import { WIDGET_REGISTRY } from "./widget-registry";

export function AddWidgetDialog({
  widgets,
  onAdd,
  onRemove,
}: {
  widgets: WidgetConfig[];
  onAdd: (type: string) => void;
  onRemove: (id: string) => void;
}) {
  const activeTypes = new Set(widgets.map((w) => w.type));
  const allWidgets = Object.values(WIDGET_REGISTRY);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="mr-1.5 size-4" />
          Ajouter un widget
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajouter un widget</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          {allWidgets.map((def) => {
            const isActive = activeTypes.has(def.type);
            const Icon = def.icon;
            return (
              <button
                key={def.type}
                onClick={() => {
                  if (isActive) {
                    const widget = widgets.find((w) => w.type === def.type);
                    if (widget) onRemove(widget.id);
                  } else {
                    onAdd(def.type);
                  }
                }}
                className={`relative flex flex-col items-start gap-1.5 rounded-lg border p-3 text-left transition-colors hover:bg-muted ${
                  isActive ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                {isActive && (
                  <div className="absolute right-2 top-2 rounded-full bg-primary p-0.5 text-primary-foreground">
                    <Check className="size-3" />
                  </div>
                )}
                <Icon className="size-5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">{def.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {def.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
