import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Badge } from "@workspace/ui/components/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Copy, Trash2, UserPlus } from "lucide-react";
import type { OrgInvitation, OrgMember } from "@/lib/types";
import { useActiveMember } from "@/hooks/use-active-member";
import { authClient } from "@/lib/auth-client";

export function SettingsMembersPage() {
  const queryClient = useQueryClient();
  const { fullOrg, canManage, isLoading } = useActiveMember();
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"member" | "admin">("member");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (isLoading || !fullOrg) {
    return (
      <div className="text-muted-foreground py-8 text-center">Loading...</div>
    );
  }

  const members = fullOrg.members;
  const invitations = fullOrg.invitations.filter(
    (inv: OrgInvitation) => inv.status === "pending",
  );

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["fullOrganization"] });
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInviting(true);

    const { data, error: invErr } = await authClient.organization.inviteMember({
      email,
      role: inviteRole,
    });

    if (invErr) {
      setError(invErr.message ?? "Failed to invite member.");
      setInviting(false);
      return;
    }

    if (data.id) {
      const link = `${window.location.origin}/invitations/accept?invitationId=${data.id}`;
      await navigator.clipboard.writeText(link);
      setCopiedId(data.id);
      setTimeout(() => setCopiedId(null), 3000);
    }

    setEmail("");
    setInviting(false);
    invalidate();
  }

  async function handleChangeRole(memberId: string, role: string) {
    await authClient.organization.updateMemberRole({
      memberId,
      role: role as "member" | "admin",
    });
    invalidate();
  }

  async function handleRemoveMember(memberIdOrUserId: string) {
    if (!confirm("Remove this member?")) return;
    await authClient.organization.removeMember({
      memberIdOrEmail: memberIdOrUserId,
    });
    invalidate();
  }

  async function handleCancelInvitation(invitationId: string) {
    await authClient.organization.cancelInvitation({ invitationId });
    invalidate();
  }

  function copyInviteLink(invitationId: string) {
    const link = `${window.location.origin}/invitations/accept?invitationId=${invitationId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(invitationId);
    setTimeout(() => setCopiedId(null), 3000);
  }

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <div className="space-y-6">
      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle>Invite member</CardTitle>
            <CardDescription>
              Send an invitation to join your organization.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="flex items-end gap-3">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Select
                value={inviteRole}
                onValueChange={(v) => setInviteRole(v as "member" | "admin")}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" disabled={inviting}>
                <UserPlus className="mr-2 size-4" />
                {inviting ? "Inviting..." : "Invite"}
              </Button>
            </form>
            {error && <p className="text-destructive mt-2 text-sm">{error}</p>}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            {members.length} member{members.length !== 1 && "s"} in this
            organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                {canManage && <TableHead className="w-24" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member: OrgMember) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarImage
                          src={member.user.image ?? undefined}
                          alt={member.user.name}
                        />
                        <AvatarFallback>
                          {getInitials(member.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {member.user.name}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {member.user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {canManage && member.role !== "owner" ? (
                      <Select
                        value={member.role}
                        onValueChange={(v) => handleChangeRole(member.id, v)}
                      >
                        <SelectTrigger className="h-8 w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="secondary" className="capitalize">
                        {member.role}
                      </Badge>
                    )}
                  </TableCell>
                  {canManage && (
                    <TableCell>
                      {member.role !== "owner" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending invitations</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((inv: OrgInvitation) => (
                  <TableRow key={inv.id}>
                    <TableCell>{inv.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {inv.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyInviteLink(inv.id)}
                          title="Copy invite link"
                        >
                          <Copy className="size-4" />
                        </Button>
                        {canManage && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCancelInvitation(inv.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>
                      {copiedId === inv.id && (
                        <p className="text-muted-foreground text-xs">
                          Link copied!
                        </p>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
