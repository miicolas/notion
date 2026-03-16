import { Link } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import type { Client } from "@/lib/types";

export function ClientTable({ clients }: { clients: Client[] }) {
  if (clients.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        No clients yet. Create your first client to get started.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Website</TableHead>
          <TableHead className="text-right">Projects</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.map((client) => (
          <TableRow key={client.id}>
            <TableCell>
              <Link
                to={`/clients/${client.id}`}
                className="font-medium hover:underline"
              >
                {client.name}
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {client.email ?? "\u2014"}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {client.phone ?? "\u2014"}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {client.website ?? "\u2014"}
            </TableCell>
            <TableCell className="text-right">
              {client.projects?.length ?? 0}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
