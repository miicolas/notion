import { Link } from "react-router-dom";
import { Badge } from "@workspace/ui/components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import type { Project } from "@/lib/types";

export function ProjectTable({ projects }: { projects: Array<Project> }) {
  if (projects.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        No projects yet. Create your first project to get started.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Issues</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => (
          <TableRow key={project.id}>
            <TableCell>
              <Link
                to={`/projects/${project.id}?view=table`}
                className="font-medium hover:underline"
              >
                {project.name}
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {project.client?.name ?? "\u2014"}
            </TableCell>
            <TableCell>
              <Badge
                variant={project.status === "active" ? "default" : "secondary"}
              >
                {project.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              {project.issues?.length ?? 0}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
