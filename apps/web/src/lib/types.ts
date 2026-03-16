export type Organization = {
  id: string
  name: string
  slug: string
  logo?: string | null
}

export type Client = {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
  website?: string | null
  logo?: string | null
  notes?: string | null
  projects?: Project[]
}

export type Project = {
  id: string
  name: string
  description?: string | null
  status: string
  clientId?: string | null
  client?: { id: string; name: string } | null
  issues?: { id: string }[]
  startDate?: string | null
  endDate?: string | null
}

export type Member = {
  id: string
  user: {
    id: string
    name: string
    email?: string
    image?: string | null
  }
}

export type LabelItem = {
  id: string
  name: string
  color: string
}

export type Issue = {
  id: string
  title: string
  description?: string | null
  status: string
  priority: string
  sortOrder: number
  projectId?: string
  deadline?: string | null
  assigneeId?: string | null
  assignee?: {
    user: { id: string; name: string; image?: string | null }
  } | null
  issueLabels?: { label: LabelItem }[]
  project?: { id: string; name: string } | null
  comments?: Comment[]
}

export type Comment = {
  id: string
  content: string
  createdAt: string
  author: { id: string; name: string; image?: string | null }
}

export type DashboardStats = {
  issuesByStatus: { status: string; count: number }[]
  issuesByPriority: { priority: string; count: number }[]
  issuesByAssignee: { assigneeId: string; assigneeName: string; count: number }[]
  issuesByProject: { projectId: string; projectName: string; count: number }[]
  issuesOverTime: { date: string; count: number }[]
}

export type WidgetConfig = {
  id: string
  type: string
  size: "sm" | "md" | "lg"
}
