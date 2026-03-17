import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Plus, Trash2 } from "lucide-react";
import type { Team } from "@/lib/types";
import { TeamForm } from "@/components/team-form";
import { useActiveMember } from "@/hooks/use-active-member";
import { deleteTeam, getTeams } from "@/lib/teams";

export function SettingsTeamsPage() {
  const queryClient = useQueryClient();
  const { canManage } = useActiveMember();
  const { data: teams = [] } = useQuery<Array<Team>>({
    queryKey: ["teams"],
    queryFn: getTeams,
  });
  const [showForm, setShowForm] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: deleteTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });

  function handleDelete(id: string) {
    if (!confirm("Delete this team?")) return;
    deleteMutation.mutate(id);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Teams</h2>
        {canManage && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="mr-2 size-4" />
            New team
          </Button>
        )}
      </div>

      {teams.length === 0 ? (
        <div className="text-muted-foreground flex h-40 items-center justify-center">
          No teams yet.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Members</TableHead>
              {canManage && <TableHead className="w-24" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.map((team) => (
              <TableRow key={team.id}>
                <TableCell>
                  <Link
                    to={`/teams/${team.id}`}
                    className="font-medium hover:underline"
                  >
                    {team.name}
                  </Link>
                </TableCell>
                <TableCell>{team.members?.length ?? 0}</TableCell>
                {canManage && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(team.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <TeamForm open={showForm} onOpenChange={setShowForm} />
    </div>
  );
}
