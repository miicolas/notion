import { useQuery } from "@tanstack/react-query";
import { Building2, CircleDot, FolderKanban, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  fetchIssuesByPriority,
  fetchIssuesByStatus,
  fetchIssuesOverTime,
  fetchOrgsActivity,
  fetchProjectsPerOrg,
  fetchStats,
  fetchUsersGrowth,
  fetchUsersPerOrg,
} from "@/lib/admin-api";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function DashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: fetchStats,
  });

  const { data: usersGrowth } = useQuery({
    queryKey: ["admin", "charts", "users-growth"],
    queryFn: fetchUsersGrowth,
  });

  const { data: issuesOverTime } = useQuery({
    queryKey: ["admin", "charts", "issues-over-time"],
    queryFn: fetchIssuesOverTime,
  });

  const { data: issuesByStatus } = useQuery({
    queryKey: ["admin", "charts", "issues-by-status"],
    queryFn: fetchIssuesByStatus,
  });

  const { data: issuesByPriority } = useQuery({
    queryKey: ["admin", "charts", "issues-by-priority"],
    queryFn: fetchIssuesByPriority,
  });

  const { data: orgsActivity } = useQuery({
    queryKey: ["admin", "charts", "orgs-activity"],
    queryFn: fetchOrgsActivity,
  });

  const { data: projectsPerOrg } = useQuery({
    queryKey: ["admin", "charts", "projects-per-org"],
    queryFn: fetchProjectsPerOrg,
  });

  const { data: usersPerOrg } = useQuery({
    queryKey: ["admin", "charts", "users-per-org"],
    queryFn: fetchUsersPerOrg,
  });

  const kpis = [
    {
      title: "Total Users",
      value: stats?.totalUsers ?? 0,
      icon: Users,
    },
    {
      title: "Total Organizations",
      value: stats?.totalOrgs ?? 0,
      icon: Building2,
    },
    {
      title: "Total Projects",
      value: stats?.totalProjects ?? 0,
      icon: FolderKanban,
    },
    {
      title: "Total Issues",
      value: stats?.totalIssues ?? 0,
      icon: CircleDot,
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {kpi.title}
              </CardTitle>
              <kpi.icon className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* User Growth */}
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: { label: "Users", color: "hsl(var(--chart-1))" },
              }}
              className="h-[300px] w-full"
            >
              <AreaChart data={usersGrowth ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--chart-1))"
                  fill="hsl(var(--chart-1))"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Issues Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Issues Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: { label: "Issues", color: "hsl(var(--chart-2))" },
              }}
              className="h-[300px] w-full"
            >
              <AreaChart data={issuesOverTime ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--chart-2))"
                  fill="hsl(var(--chart-2))"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Issues by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Issues by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: { label: "Issues", color: "hsl(var(--chart-3))" },
              }}
              className="h-[300px] w-full"
            >
              <BarChart data={issuesByStatus ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="count"
                  fill="hsl(var(--chart-3))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Issues by Priority */}
        <Card>
          <CardHeader>
            <CardTitle>Issues by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: { label: "Issues", color: "hsl(var(--chart-4))" },
              }}
              className="h-[300px] w-full"
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={issuesByPriority ?? []}
                  dataKey="count"
                  nameKey="priority"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ priority }) => priority}
                >
                  {(issuesByPriority ?? []).map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Most Active Organizations */}
        <Card>
          <CardHeader>
            <CardTitle>Most Active Organizations</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: { label: "Issues", color: "hsl(var(--chart-1))" },
              }}
              className="h-[300px] w-full"
            >
              <BarChart data={orgsActivity ?? []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="orgName" type="category" width={120} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="count"
                  fill="hsl(var(--chart-1))"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Projects per Organization */}
        <Card>
          <CardHeader>
            <CardTitle>Projects per Organization</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: { label: "Projects", color: "hsl(var(--chart-2))" },
              }}
              className="h-[300px] w-full"
            >
              <BarChart data={projectsPerOrg ?? []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="orgName" type="category" width={120} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="count"
                  fill="hsl(var(--chart-2))"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Users per Organization */}
        <Card>
          <CardHeader>
            <CardTitle>Users per Organization</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: { label: "Members", color: "hsl(var(--chart-3))" },
              }}
              className="h-[300px] w-full"
            >
              <BarChart data={usersPerOrg ?? []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="orgName" type="category" width={120} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="count"
                  fill="hsl(var(--chart-3))"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
