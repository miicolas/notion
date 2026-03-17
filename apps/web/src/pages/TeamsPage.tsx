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
import { PageHeader } from "@/components/page-header";
import { TeamForm } from "@/components/team-form";
import { deleteTeam, getTeams } from "@/lib/teams";

export function TeamsPage() {
  const queryClient = useQueryClient();
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
    <>
      <PageHeader title="Teams" />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Teams</h1>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 size-4" />
            New team
          </Button>
        </div>

        {teams.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            No teams yet. Create your first team to organize members.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Members</TableHead>
                <TableHead className="w-24"></TableHead>
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
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(team.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <TeamForm open={showForm} onOpenChange={setShowForm} />
      </div>
    </>
  );
}
