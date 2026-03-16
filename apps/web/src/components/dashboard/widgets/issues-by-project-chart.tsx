import { RadialBar, RadialBarChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@workspace/ui/components/chart";
import type { WidgetProps } from "../widget-registry";

const colors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function IssuesByProjectChart({ stats }: WidgetProps) {
  const data = stats.issuesByProject.map((d, i) => ({
    name: d.projectName,
    count: d.count,
    fill: colors[i % colors.length],
  }));

  const chartConfig = Object.fromEntries(
    data.map((d) => [d.name, { label: d.name, color: d.fill }]),
  ) as ChartConfig;

  return (
    <ChartContainer config={chartConfig} className="h-[200px] w-full">
      <RadialBarChart
        data={data}
        innerRadius={30}
        outerRadius={100}
        cx="50%"
        cy="50%"
      >
        <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
        <RadialBar dataKey="count" background />
      </RadialBarChart>
    </ChartContainer>
  );
}
