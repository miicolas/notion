import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Card,
  CardContent,
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
import { fetchOrganizations } from "@/lib/admin-api";

export function OrganizationsPage() {
  const { data: orgs, isLoading } = useQuery({
    queryKey: ["admin", "organizations"],
    queryFn: fetchOrganizations,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Organizations</h1>

      <Card>
        <CardHeader>
          <CardTitle>All Organizations ({orgs?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-muted-foreground py-8 text-center">
              Loading...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orgs?.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">{org.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {org.slug}
                    </TableCell>
                    <TableCell>{org.memberCount}</TableCell>
                    <TableCell>
                      {format(new Date(org.createdAt), "MMM d, yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
