import { Pie, PieChart } from "recharts";
import {
  
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@workspace/ui/components/chart";
import type {ChartConfig} from "@workspace/ui/components/chart";
import type { WidgetProps } from "../widget-registry";

const priorityColors: Record<string, string> = {
  urgent: "var(--chart-1)",
  high: "var(--chart-2)",
  medium: "var(--chart-3)",
  low: "var(--chart-4)",
  no_priority: "var(--chart-5)",
};

const priorityLabels: Record<string, string> = {
  urgent: "Urgent",
  high: "Haute",
  medium: "Moyenne",
  low: "Basse",
  no_priority: "Aucune",
};

export function IssuesByPriorityChart({ stats }: WidgetProps) {
  const data = stats.issuesByPriority.map((d) => ({
    priority: priorityLabels[d.priority] ?? d.priority,
    count: d.count,
    fill: priorityColors[d.priority] ?? "var(--chart-5)",
  }));

  const chartConfig = Object.fromEntries(
    data.map((d) => [d.priority, { label: d.priority, color: d.fill }]),
  ) as ChartConfig;

  return (
    <ChartContainer config={chartConfig} className="h-[200px] w-full">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent />} />
        <Pie
          data={data}
          dataKey="count"
          nameKey="priority"
          innerRadius={40}
          outerRadius={80}
        />
      </PieChart>
    </ChartContainer>
  );
}
