import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getSprints } from "@/lib/sprints";
import { getMembers } from "@/lib/members";
import { useAuth } from "@/lib/auth-context";
import { SprintList } from "@/components/sprint-list";

export function SprintsPage() {
  const { user } = useAuth();
  const { projectId } = useParams<{ projectId: string }>();

  const { data: sprints = [] } = useQuery({
    queryKey: ["sprints", projectId],
    queryFn: () => getSprints(projectId!),
    enabled: !!projectId,
  });

  const { data: members = [] } = useQuery({
    queryKey: ["members"],
    queryFn: getMembers,
  });

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <SprintList
        sprints={sprints}
        projectId={projectId!}
        members={members}
        currentUserId={user?.id}
      />
    </div>
  );
}
