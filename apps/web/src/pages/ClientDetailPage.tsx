import { useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getClient, deleteClient } from "@/lib/clients"
import { ClientForm } from "@/components/client-form"
import { Button } from "@workspace/ui/components/button"
import { Pencil, Trash2, ArrowLeft } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

export function ClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showEdit, setShowEdit] = useState(false)

  const { data: client, isPending } = useQuery({
    queryKey: ["client", clientId],
    queryFn: () => getClient(clientId!),
    enabled: !!clientId,
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteClient(client!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] })
      navigate("/clients")
    },
  })

  if (isPending || !client) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  function handleDelete() {
    if (!confirm("Delete this client?")) return
    deleteMutation.mutate()
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/clients">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{client.name}</h1>
          <p className="text-muted-foreground">
            {[client.email, client.phone].filter(Boolean).join(" \u00b7 ") || "No contact info"}
          </p>
        </div>
        <Button variant="outline" onClick={() => setShowEdit(true)}>
          <Pencil className="mr-2 size-4" />
          Edit
        </Button>
        <Button variant="destructive" onClick={handleDelete}>
          <Trash2 className="mr-2 size-4" />
          Delete
        </Button>
      </div>

      {client.website && (
        <p className="text-sm text-muted-foreground">
          Website: <a href={client.website} target="_blank" rel="noreferrer" className="underline">{client.website}</a>
        </p>
      )}

      {client.notes && (
        <div>
          <h2 className="mb-2 font-semibold">Notes</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{client.notes}</p>
        </div>
      )}

      <div>
        <h2 className="mb-2 font-semibold">Projects ({client.projects?.length ?? 0})</h2>
        {client.projects?.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {client.projects.map((project: any) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <Link
                      to={`/projects/${project.id}?view=table`}
                      className="font-medium hover:underline"
                    >
                      {project.name}
                    </Link>
                  </TableCell>
                  <TableCell>{project.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground">No projects for this client yet.</p>
        )}
      </div>

      <ClientForm
        client={client}
        open={showEdit}
        onOpenChange={setShowEdit}
      />
    </div>
  )
}
