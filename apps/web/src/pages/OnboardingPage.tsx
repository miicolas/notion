import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field"
import { Separator } from "@workspace/ui/components/separator"
import { authClient } from "@/lib/auth-client"
import { useAuth } from "@/lib/auth-context"
import { getUserInvitations } from "@/lib/organization"

export function OnboardingPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { refetch } = useAuth()
  const [orgName, setOrgName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const { data: invitations = [] } = useQuery({
    queryKey: ["invitations"],
    queryFn: getUserInvitations,
  })

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()
  }

  async function handleCreateOrg(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const slug = generateSlug(orgName)
    if (!slug) {
      setError("Please enter a valid organization name.")
      setLoading(false)
      return
    }

    const { error: createError } = await authClient.organization.create({
      name: orgName,
      slug,
    })

    if (createError) {
      setError(createError.message ?? "Failed to create organization.")
      setLoading(false)
      return
    }

    await refetch()
    navigate("/")
  }

  async function handleAccept(invitationId: string) {
    setActionLoading(invitationId)
    const { error: acceptError } =
      await authClient.organization.acceptInvitation({
        invitationId,
      })

    if (acceptError) {
      setError(acceptError.message ?? "Failed to accept invitation.")
      setActionLoading(null)
      return
    }

    await refetch()
    navigate("/")
  }

  async function handleReject(invitationId: string) {
    setActionLoading(invitationId)
    const { error: rejectError } =
      await authClient.organization.rejectInvitation({
        invitationId,
      })

    if (rejectError) {
      setError(rejectError.message ?? "Failed to reject invitation.")
      setActionLoading(null)
      return
    }

    queryClient.invalidateQueries({ queryKey: ["invitations"] })
    setActionLoading(null)
  }

  const pendingInvitations = invitations.filter(
    (inv: { status: string }) => inv.status === "pending",
  )

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Welcome!</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Create an organization or accept an invitation to get started.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create an organization</CardTitle>
            <CardDescription>
              Start a new workspace for your team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateOrg}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="org-name">Organization name</FieldLabel>
                  <Input
                    id="org-name"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="My Organization"
                    required
                  />
                  {orgName && (
                    <p className="text-muted-foreground text-xs">
                      Slug: {generateSlug(orgName) || "\u2014"}
                    </p>
                  )}
                </Field>
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create Organization"}
                </Button>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>

        {pendingInvitations.length > 0 && (
          <>
            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-muted-foreground text-xs">or</span>
              <Separator className="flex-1" />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Pending invitations</CardTitle>
                <CardDescription>
                  You've been invited to join these organizations.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingInvitations.map(
                  (inv: {
                    id: string
                    organizationName?: string
                    organizationSlug?: string
                    role?: string
                  }) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {inv.organizationName ?? inv.organizationSlug ?? "Organization"}
                        </p>
                        {inv.role && (
                          <p className="text-muted-foreground text-xs capitalize">
                            Role: {inv.role}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionLoading === inv.id}
                          onClick={() => handleReject(inv.id)}
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          disabled={actionLoading === inv.id}
                          onClick={() => handleAccept(inv.id)}
                        >
                          Accept
                        </Button>
                      </div>
                    </div>
                  ),
                )}
              </CardContent>
            </Card>
          </>
        )}

        {error && (
          <p className="text-destructive text-center text-sm">{error}</p>
        )}
      </div>
    </div>
  )
}
