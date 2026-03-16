import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { getProjects } from "@/lib/projects";
import { getIssues } from "@/lib/issues";
import { Badge } from "@workspace/ui/components/badge";
import type { WidgetProps } from "../widget-registry";

export function RecentActivityWidget(_props: WidgetProps) {
  const { activeOrganization } = useAuth();
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
    enabled: !!activeOrganization,
  });
  const { data: issues = [] } = useQuery({
    queryKey: ["issues"],
    queryFn: () => getIssues(),
    enabled: !!activeOrganization,
  });

  const recentProjects = projects
    .filter((p) => p.status === "active")
    .slice(0, 5);
  const recentIssues = issues.slice(0, 5);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <h4 className="mb-2 text-sm font-medium text-muted-foreground">
          Projets récents
        </h4>
        {recentProjects.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun projet.</p>
        ) : (
          <div className="space-y-1.5">
            {recentProjects.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}?view=table`}
                className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted"
              >
                <span className="text-sm font-medium">{project.name}</span>
                <Badge variant="secondary">{project.issues?.length ?? 0}</Badge>
              </Link>
            ))}
          </div>
        )}
      </div>
      <div>
        <h4 className="mb-2 text-sm font-medium text-muted-foreground">
          Issues récentes
        </h4>
        {recentIssues.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune issue.</p>
        ) : (
          <div className="space-y-1.5">
            {recentIssues.map((issue) => (
              <Link
                key={issue.id}
                to={`/issues/${issue.id}`}
                className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted"
              >
                <span className="text-sm">{issue.title}</span>
                <Badge variant="outline">
                  {issue.status.replace("_", " ")}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
