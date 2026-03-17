export type Organization = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
};

export type Client = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  website?: string | null;
  logo?: string | null;
  notes?: string | null;
  projects?: Project[];
};

export type Project = {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  clientId?: string | null;
  client?: { id: string; name: string } | null;
  issues?: { id: string }[];
  startDate?: string | null;
  endDate?: string | null;
};

export type Member = {
  id: string;
  user: {
    id: string;
    name: string;
    email?: string;
    image?: string | null;
  };
};

export type LabelItem = {
  id: string;
  name: string;
  color: string;
};

export type Sprint = {
  id: string;
  projectId: string;
  name: string;
  goal?: string | null;
  startDate: string;
  endDate: string;
  status: "draft" | "planned" | "active" | "in_review" | "completed";
  duration: "1w" | "2w" | "3w" | "1m" | "custom";
  ownerId?: string | null;
  owner?: {
    user: { id: string; name: string; image?: string | null };
  } | null;
  releaseStatus?: "pre_release" | "release_candidate" | "released" | null;
  retrospective?: string | null;
  sprintMembers?: {
    member: {
      id: string;
      user: { id: string; name: string; image?: string | null };
    };
  }[];
};

export type SprintComment = {
  id: string;
  sprintId: string;
  content: string;
  type: "update" | "retrospective";
  createdAt: string;
  updatedAt: string;
  author: { id: string; name: string; image?: string | null };
};

export type Issue = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  sortOrder: number;
  projectId?: string;
  deadline?: string | null;
  assigneeId?: string | null;
  sprintId?: string | null;
  assignee?: {
    user: { id: string; name: string; image?: string | null };
  } | null;
  issueLabels?: { label: LabelItem }[];
  project?: { id: string; name: string } | null;
  sprint?: { id: string; name: string; status: string } | null;
  comments?: Comment[];
};

export type Comment = {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string; image?: string | null };
};

export type Team = {
  id: string;
  name: string;
  organizationId: string;
  createdAt: string;
  members?: TeamMember[];
};

export type TeamMember = {
  id: string;
  teamId: string;
  userId: string;
  user?: { id: string; name: string; email?: string; image?: string | null };
};

export type OrgMember = {
  id: string;
  role: "owner" | "admin" | "member";
  userId: string;
  organizationId: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
};

export type OrgInvitation = {
  id: string;
  email: string;
  role: "admin" | "member";
  status: "pending" | "accepted" | "rejected" | "canceled";
  organizationId: string;
  inviterId: string;
  expiresAt: string;
};

export type FullOrganization = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  members: OrgMember[];
  invitations: OrgInvitation[];
};

export type DashboardStats = {
  issuesByStatus: { status: string; count: number }[];
  issuesByPriority: { priority: string; count: number }[];
  issuesByAssignee: {
    assigneeId: string;
    assigneeName: string;
    count: number;
  }[];
  issuesByProject: { projectId: string; projectName: string; count: number }[];
  issuesOverTime: { date: string; count: number }[];
};

export type WidgetConfig = {
  id: string;
  type: string;
  size: "sm" | "md" | "lg";
};
