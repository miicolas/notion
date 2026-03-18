import { Bar, BarChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart";
import type { ChartConfig } from "@workspace/ui/components/chart";
import type { WidgetProps } from "../widget-registry";

const chartConfig = {
  count: { label: "Issues", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function IssuesByAssigneeChart({ stats }: WidgetProps) {
  const data = stats.issuesByAssignee.map((d) => ({
    name: d.assigneeName,
    count: d.count,
  }));

  return (
    <ChartContainer config={chartConfig} className="h-[200px] w-full">
      <BarChart data={data} layout="vertical">
        <XAxis
          type="number"
          tickLine={false}
          axisLine={false}
          fontSize={12}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tickLine={false}
          axisLine={false}
          fontSize={12}
          width={100}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="var(--chart-2)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
