import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getIssues } from "@/lib/issues";
import { getLabels } from "@/lib/labels";
import { getMembers } from "@/lib/members";
import { getSprints } from "@/lib/sprints";
import { getTeams } from "@/lib/teams";
import { IssueTable } from "@/components/issue-table";
import { IssueKanban } from "@/components/issue-kanban";
import { IssueForm } from "@/components/issue-form";
import { Button } from "@workspace/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Plus, LayoutList, Kanban } from "lucide-react";

export function ProjectIssuesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get("view") ?? "table";
  const [showForm, setShowForm] = useState(false);
  const [selectedSprintId, setSelectedSprintId] = useState<string>("all");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("all");

  const { data: sprints = [] } = useQuery({
    queryKey: ["sprints", projectId],
    queryFn: () => getSprints(projectId!),
    enabled: !!projectId,
  });

  const { data: teams = [] } = useQuery({
    queryKey: ["teams"],
    queryFn: getTeams,
  });

  const sprintIdParam =
    selectedSprintId === "all"
      ? undefined
      : selectedSprintId === "backlog"
        ? "none"
        : selectedSprintId;
  const teamIdParam = selectedTeamId === "all" ? undefined : selectedTeamId;

  const { data: issues = [] } = useQuery({
    queryKey: [
      "issues",
      { projectId, sprintId: sprintIdParam, teamId: teamIdParam },
    ],
    queryFn: () =>
      getIssues({ projectId, sprintId: sprintIdParam, teamId: teamIdParam }),
  });
  const { data: labels = [] } = useQuery({
    queryKey: ["labels"],
    queryFn: getLabels,
  });
  const { data: members = [] } = useQuery({
    queryKey: ["members"],
    queryFn: getMembers,
  });

  function toggleView() {
    setSearchParams({ view: view === "kanban" ? "table" : "kanban" });
  }

  const activeSprints = sprints.filter((s) => s.status === "active");
  const inReviewSprints = sprints.filter((s) => s.status === "in_review");
  const plannedSprints = sprints.filter((s) => s.status === "planned");
  const draftSprints = sprints.filter((s) => s.status === "draft");

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Issues</h2>
        <div className="flex items-center gap-2">
          <Select value={selectedSprintId} onValueChange={setSelectedSprintId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All issues" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All issues</SelectItem>
              <SelectItem value="backlog">Backlog</SelectItem>
              {activeSprints.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} (active)
                </SelectItem>
              ))}
              {inReviewSprints.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} (in review)
                </SelectItem>
              ))}
              {plannedSprints.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} (planned)
                </SelectItem>
              ))}
              {draftSprints.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} (draft)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All teams" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All teams</SelectItem>
              {teams.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={toggleView}>
            {view === "kanban" ? (
              <>
                <LayoutList className="mr-1 size-4" />
                Table
              </>
            ) : (
              <>
                <Kanban className="mr-1 size-4" />
                Kanban
              </>
            )}
          </Button>
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="mr-1 size-4" />
            New issue
          </Button>
        </div>
      </div>

      {view === "kanban" ? (
        <IssueKanban issues={issues} />
      ) : (
        <IssueTable issues={issues} />
      )}

      <IssueForm
        projectId={projectId!}
        labels={labels}
        members={members}
        sprints={sprints}
        open={showForm}
        onOpenChange={setShowForm}
      />
    </div>
  );
}
