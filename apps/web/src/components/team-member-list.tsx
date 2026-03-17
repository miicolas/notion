import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { UserMinus } from "lucide-react";
import { useState } from "react";
import type { TeamMember } from "@/lib/types";
import { getMembers } from "@/lib/members";
import { addTeamMember, removeTeamMember } from "@/lib/teams";

export function TeamMemberList({
  teamId,
  members,
}: {
  teamId: string;
  members: Array<TeamMember>;
}) {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState("");

  const { data: orgMembers = [] } = useQuery({
    queryKey: ["members"],
    queryFn: getMembers,
  });

  // Filter out users already in the team
  const teamUserIds = new Set(members.map((m) => m.userId));
  const availableMembers = orgMembers.filter(
    (m) => !teamUserIds.has(m.user.id),
  );

  const addMutation = useMutation({
    mutationFn: addTeamMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", teamId] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      setSelectedUserId("");
    },
  });

  const removeMutation = useMutation({
    mutationFn: removeTeamMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", teamId] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });

  function handleAdd() {
    if (!selectedUserId) return;
    addMutation.mutate({ teamId, userId: selectedUserId });
  }

  function handleRemove(userId: string) {
    removeMutation.mutate({ teamId, userId });
  }

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <div className="space-y-4">
      {/* Add member */}
      <div className="flex gap-2">
        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select a member to add" />
          </SelectTrigger>
          <SelectContent>
            {availableMembers.length === 0 ? (
              <SelectItem value="__none" disabled>
                No available members
              </SelectItem>
            ) : (
              availableMembers.map((m) => (
                <SelectItem key={m.user.id} value={m.user.id}>
                  {m.user.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <Button
          onClick={handleAdd}
          disabled={!selectedUserId || addMutation.isPending}
        >
          Add
        </Button>
      </div>

      {/* Member list */}
      {members.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No members in this team yet.
        </p>
      ) : (
        <div className="space-y-2">
          {members.map((tm) => (
            <div
              key={tm.id}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div className="flex items-center gap-3">
                <Avatar className="size-8">
                  <AvatarImage src={tm.user?.image ?? undefined} />
                  <AvatarFallback>
                    {getInitials(tm.user?.name ?? "?")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{tm.user?.name}</p>
                  {tm.user?.email && (
                    <p className="text-xs text-muted-foreground">
                      {tm.user.email}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(tm.userId)}
                disabled={removeMutation.isPending}
              >
                <UserMinus className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
