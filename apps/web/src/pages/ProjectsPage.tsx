import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { Plus } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getProjects } from "@/lib/projects";
import { getClients } from "@/lib/clients";
import { ProjectTable } from "@/components/project-table";
import { ProjectForm } from "@/components/project-form";

export function ProjectsPage() {
  const { activeOrganization } = useAuth();
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
    enabled: !!activeOrganization,
  });
  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: getClients,
    enabled: !!activeOrganization,
  });
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 size-4" />
          New project
        </Button>
      </div>
      <ProjectTable projects={projects} />
      <ProjectForm
        clients={clients}
        open={showForm}
        onOpenChange={setShowForm}
      />
    </div>
  );
}
