import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getTeam } from "@/lib/teams";
import { TeamMemberList } from "@/components/team-member-list";
import { PageHeader } from "@/components/page-header";
import { Button } from "@workspace/ui/components/button";
import { ArrowLeft } from "lucide-react";

export function TeamDetailPage() {
  const { teamId } = useParams<{ teamId: string }>();

  const { data: team, isPending } = useQuery({
    queryKey: ["team", teamId],
    queryFn: () => getTeam(teamId!),
    enabled: !!teamId,
  });

  if (isPending || !team) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <PageHeader title={team.name} />
      <div className="flex flex-1 flex-col gap-6 p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/teams">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{team.name}</h1>
            <p className="text-sm text-muted-foreground">
              {team.members?.length ?? 0} member
              {(team.members?.length ?? 0) !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-lg font-semibold">Members</h2>
          <TeamMemberList teamId={team.id} members={team.members ?? []} />
        </div>
      </div>
    </>
  );
}
