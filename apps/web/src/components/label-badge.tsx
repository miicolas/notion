import { Badge } from "@workspace/ui/components/badge";

export function LabelBadge({ name, color }: { name: string; color: string }) {
  return (
    <Badge variant="outline" className="gap-1.5 font-normal">
      <span
        className="size-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {name}
    </Badge>
  );
}
