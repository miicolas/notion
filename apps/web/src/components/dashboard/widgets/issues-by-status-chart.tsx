import { Bar, BarChart, XAxis, YAxis } from "recharts";
import {
  
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@workspace/ui/components/chart";
import type {ChartConfig} from "@workspace/ui/components/chart";
import type { WidgetProps } from "../widget-registry";

const chartConfig = {
  count: { label: "Issues", color: "var(--chart-1)" },
} satisfies ChartConfig;

const statusLabels: Record<string, string> = {
  backlog: "Backlog",
  todo: "To Do",
  in_progress: "En cours",
  done: "Terminé",
  cancelled: "Annulé",
};

export function IssuesByStatusChart({ stats }: WidgetProps) {
  const data = stats.issuesByStatus.map((d) => ({
    status: statusLabels[d.status] ?? d.status,
    count: d.count,
  }));

  return (
    <ChartContainer config={chartConfig} className="h-[200px] w-full">
      <BarChart data={data}>
        <XAxis
          dataKey="status"
          tickLine={false}
          axisLine={false}
          fontSize={12}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          fontSize={12}
          allowDecimals={false}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
