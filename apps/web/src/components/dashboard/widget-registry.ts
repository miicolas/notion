import type { ComponentType } from "react"
import type { DashboardStats, WidgetConfig } from "@/lib/types"
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  FolderKanban,
  Activity,
} from "lucide-react"
import { IssuesByStatusChart } from "./widgets/issues-by-status-chart"
import { IssuesByPriorityChart } from "./widgets/issues-by-priority-chart"
import { IssuesOverTimeChart } from "./widgets/issues-over-time-chart"
import { IssuesByAssigneeChart } from "./widgets/issues-by-assignee-chart"
import { IssuesByProjectChart } from "./widgets/issues-by-project-chart"
import { RecentActivityWidget } from "./widgets/recent-activity-widget"

export type WidgetProps = { stats: DashboardStats }

export type WidgetDefinition = {
  type: string
  label: string
  description: string
  icon: ComponentType<{ className?: string }>
  defaultSize: WidgetConfig["size"]
  component: ComponentType<WidgetProps>
}

export const WIDGET_REGISTRY: Record<string, WidgetDefinition> = {
  "issues-by-status": {
    type: "issues-by-status",
    label: "Issues par statut",
    description: "Répartition des issues par statut",
    icon: BarChart3,
    defaultSize: "md",
    component: IssuesByStatusChart,
  },
  "issues-by-priority": {
    type: "issues-by-priority",
    label: "Issues par priorité",
    description: "Répartition des issues par priorité",
    icon: PieChart,
    defaultSize: "sm",
    component: IssuesByPriorityChart,
  },
  "issues-over-time": {
    type: "issues-over-time",
    label: "Issues dans le temps",
    description: "Évolution des issues sur 12 semaines",
    icon: TrendingUp,
    defaultSize: "lg",
    component: IssuesOverTimeChart,
  },
  "issues-by-assignee": {
    type: "issues-by-assignee",
    label: "Issues par assigné",
    description: "Répartition des issues par membre",
    icon: Users,
    defaultSize: "md",
    component: IssuesByAssigneeChart,
  },
  "issues-by-project": {
    type: "issues-by-project",
    label: "Issues par projet",
    description: "Répartition des issues par projet",
    icon: FolderKanban,
    defaultSize: "sm",
    component: IssuesByProjectChart,
  },
  "recent-activity": {
    type: "recent-activity",
    label: "Activité récente",
    description: "Projets et issues récents",
    icon: Activity,
    defaultSize: "md",
    component: RecentActivityWidget,
  },
}

export const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "1", type: "issues-by-status", size: "md" },
  { id: "2", type: "issues-by-priority", size: "sm" },
  { id: "3", type: "issues-over-time", size: "lg" },
  { id: "4", type: "issues-by-assignee", size: "md" },
  { id: "5", type: "issues-by-project", size: "sm" },
  { id: "6", type: "recent-activity", size: "md" },
]
