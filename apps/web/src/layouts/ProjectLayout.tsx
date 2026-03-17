import { Link, Outlet, useLocation, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@workspace/ui/lib/utils";
import { getProject } from "@/lib/projects";

export function ProjectLayout() {
  const { projectId } = useParams<{ projectId: string }>();
  const { pathname } = useLocation();

  const { data: project, isPending } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProject(projectId!),
    enabled: !!projectId,
  });

  if (isPending || !project) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const basePath = `/projects/${projectId}`;
  const tabs = [
    { label: "Issues", href: basePath },
    { label: "Sprints", href: `${basePath}/sprints` },
    { label: "Settings", href: `${basePath}/settings` },
  ];

  function isActive(href: string) {
    if (href === basePath) {
      return pathname === basePath || pathname === `${basePath}/`;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b px-4 py-3">
        <h1 className="text-lg font-semibold">{project.name}</h1>
        {project.description && (
          <p className="text-sm text-muted-foreground">{project.description}</p>
        )}
        <nav className="mt-3 flex gap-4">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              to={tab.href}
              className={cn(
                "border-b-2 px-1 pb-2 text-sm font-medium transition-colors",
                isActive(tab.href)
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>
      <Outlet />
    </div>
  );
}
