import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Client } from "@/lib/types";
import { createClient, updateClient } from "@/lib/clients";

const clientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().optional(),
  notes: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

export function ClientForm({
  client,
  open,
  onOpenChange,
}: {
  client?: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const form = useForm<ClientFormValues>({
    resolver: standardSchemaResolver(clientSchema),
    defaultValues: {
      name: client?.name ?? "",
      email: client?.email ?? "",
      phone: client?.phone ?? "",
      address: client?.address ?? "",
      website: client?.website ?? "",
      notes: client?.notes ?? "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: client?.name ?? "",
        email: client?.email ?? "",
        phone: client?.phone ?? "",
        address: client?.address ?? "",
        website: client?.website ?? "",
        notes: client?.notes ?? "",
      });
    }
  }, [open, client]);

  const mutation = useMutation({
    mutationFn: (data: ClientFormValues) => {
      const payload = {
        ...data,
        email: data.email || undefined,
        phone: data.phone || undefined,
        address: data.address || undefined,
        website: data.website || undefined,
        notes: data.notes || undefined,
      };
      if (client) return updateClient({ id: client.id, ...payload });
      return createClient(payload as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["client"] });
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{client ? "Edit client" : "New client"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" {...form.register("name")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...form.register("email")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...form.register("phone")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" {...form.register("address")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input id="website" {...form.register("website")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...form.register("notes")} />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : client ? "Save" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
