import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { getClients } from "@/lib/clients"
import { ClientTable } from "@/components/client-table"
import { ClientForm } from "@/components/client-form"
import { Button } from "@workspace/ui/components/button"
import { Plus } from "lucide-react"

export function ClientsPage() {
  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: getClients,
  })
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clients</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 size-4" />
          New client
        </Button>
      </div>
      <ClientTable clients={clients} />
      <ClientForm
        open={showForm}
        onOpenChange={setShowForm}
      />
    </div>
  )
}
