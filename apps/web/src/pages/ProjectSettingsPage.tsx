import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { Trash2 } from "lucide-react";
import { deleteProject } from "@/lib/projects";
import { getClients } from "@/lib/clients";
import { ProjectForm } from "@/components/project-form";

export function ProjectSettingsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showEdit, setShowEdit] = useState(false);

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: getClients,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteProject(projectId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      navigate("/projects");
    },
  });

  function handleDelete() {
    if (!confirm("Delete this project and all its issues?")) return;
    deleteMutation.mutate();
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <h2 className="font-semibold">Project Settings</h2>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setShowEdit(true)}>
          Edit project
        </Button>
        <Button variant="destructive" onClick={handleDelete}>
          <Trash2 className="mr-2 size-4" />
          Delete project
        </Button>
      </div>
      <ProjectForm
        clients={clients}
        open={showEdit}
        onOpenChange={setShowEdit}
      />
    </div>
  );
}
