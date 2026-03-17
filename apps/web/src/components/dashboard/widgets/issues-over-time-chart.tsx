import { Area, AreaChart, XAxis, YAxis } from "recharts";
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

export function IssuesOverTimeChart({ stats }: WidgetProps) {
  const data = stats.issuesOverTime.map((d) => ({
    date: new Date(d.date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
    }),
    count: d.count,
  }));

  return (
    <ChartContainer config={chartConfig} className="h-[200px] w-full">
      <AreaChart data={data}>
        <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
        <YAxis
          tickLine={false}
          axisLine={false}
          fontSize={12}
          allowDecimals={false}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          type="monotone"
          dataKey="count"
          fill="var(--chart-1)"
          fillOpacity={0.2}
          stroke="var(--chart-1)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}
