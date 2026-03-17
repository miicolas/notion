import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog";
import { useActiveMember } from "@/hooks/use-active-member";
import { useAuth } from "@/lib/auth-context";
import { authClient } from "@/lib/auth-client";

const orgSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
});

type OrgFormValues = z.infer<typeof orgSchema>;

export function SettingsOrganizationPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { refetch: refetchAuth } = useAuth();
  const { fullOrg, isOwner, canManage, isLoading } = useActiveMember();
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const form = useForm<OrgFormValues>({
    resolver: standardSchemaResolver(orgSchema),
    values: fullOrg ? { name: fullOrg.name, slug: fullOrg.slug } : undefined,
  });

  if (isLoading || !fullOrg) {
    return (
      <div className="text-muted-foreground py-8 text-center">Loading...</div>
    );
  }

  async function onSubmit(data: OrgFormValues) {
    setError(null);
    const { error: updateError } = await authClient.organization.update({
      data: { name: data.name, slug: data.slug },
    });
    if (updateError) {
      setError(updateError.message ?? "Failed to update organization.");
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["fullOrganization"] });
    await refetchAuth();
  }

  async function handleDelete() {
    setDeleting(true);
    const { error: deleteError } = await authClient.organization.delete({
      organizationId: fullOrg!.id,
    });
    if (deleteError) {
      setError(deleteError.message ?? "Failed to delete organization.");
      setDeleting(false);
      return;
    }
    await refetchAuth();
    navigate("/onboarding");
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
          <CardDescription>
            {canManage
              ? "Manage your organization settings."
              : "View organization details."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="org-name">Name</FieldLabel>
                <Input
                  id="org-name"
                  disabled={!canManage}
                  {...form.register("name")}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="org-slug">Slug</FieldLabel>
                <Input
                  id="org-slug"
                  disabled={!canManage}
                  {...form.register("slug")}
                />
              </Field>
              {canManage && (
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting || !form.formState.isDirty}
                >
                  {form.formState.isSubmitting ? "Saving..." : "Save changes"}
                </Button>
              )}
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      {isOwner && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle>Danger zone</CardTitle>
            <CardDescription>
              Permanently delete this organization and all its data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete organization</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete organization?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete "{fullOrg.name}" and all
                    associated data. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={deleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}

      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
