import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { authClient } from "@/lib/auth-client";
import { useAuth } from "@/lib/auth-context";

export function InvitationAcceptPage() {
  const [searchParams] = useSearchParams();
  const invitationId = searchParams.get("invitationId");
  const navigate = useNavigate();
  const { refetch } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<"accepted" | "rejected" | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!invitationId) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid invitation</CardTitle>
            <CardDescription>
              No invitation ID was provided in the URL.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  async function handleAccept() {
    setLoading(true);
    setError(null);
    const { error: acceptError } =
      await authClient.organization.acceptInvitation({
        invitationId: invitationId!,
      });
    if (acceptError) {
      setError(acceptError.message ?? "Failed to accept invitation.");
      setLoading(false);
      return;
    }
    setResult("accepted");
    await refetch();
    navigate("/");
  }

  async function handleReject() {
    setLoading(true);
    setError(null);
    const { error: rejectError } =
      await authClient.organization.rejectInvitation({
        invitationId: invitationId!,
      });
    if (rejectError) {
      setError(rejectError.message ?? "Failed to reject invitation.");
      setLoading(false);
      return;
    }
    setResult("rejected");
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Organization invitation</CardTitle>
          <CardDescription>
            {result === "rejected"
              ? "You have declined this invitation."
              : "You've been invited to join an organization."}
          </CardDescription>
        </CardHeader>
        {result !== "rejected" && (
          <CardContent className="flex gap-3">
            <Button variant="outline" onClick={handleReject} disabled={loading}>
              Decline
            </Button>
            <Button onClick={handleAccept} disabled={loading}>
              {loading ? "Accepting..." : "Accept invitation"}
            </Button>
          </CardContent>
        )}
        {error && (
          <CardContent>
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
