import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { LabelItem } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { createLabel, deleteLabel, getLabels, updateLabel } from "@/lib/labels";

const PRESET_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#6b7280",
];

const labelSchema = z.object({
  name: z.string().min(1),
  color: z.string().min(1),
});

type LabelFormValues = z.infer<typeof labelSchema>;

export function LabelsPage() {
  const queryClient = useQueryClient();
  const { data: labels = [] } = useQuery({
    queryKey: ["labels"],
    queryFn: getLabels,
  });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<LabelItem | null>(null);

  const form = useForm<LabelFormValues>({
    resolver: standardSchemaResolver(labelSchema),
    defaultValues: { name: "", color: PRESET_COLORS[0] },
  });

  useEffect(() => {
    if (showForm) {
      form.reset({
        name: editing?.name ?? "",
        color: editing?.color ?? PRESET_COLORS[0],
      });
    }
  }, [showForm, editing]);

  const saveMutation = useMutation({
    mutationFn: (data: { id?: string; name: string; color: string }) => {
      if (data.id)
        return updateLabel(data as { id: string; name: string; color: string });
      return createLabel({ name: data.name, color: data.color });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labels"] });
      setShowForm(false);
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLabel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labels"] });
    },
  });

  function onSubmit(data: LabelFormValues) {
    saveMutation.mutate({
      id: editing?.id,
      name: data.name,
      color: data.color,
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this label?")) return;
    deleteMutation.mutate(id);
  }

  return (
    <>
      <PageHeader title="Labels" />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Labels</h1>
          <Button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
          >
            <Plus className="mr-2 size-4" />
            New label
          </Button>
        </div>

        {labels.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            No labels yet. Create your first label to categorize issues.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Color</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {labels.map((label) => (
                <TableRow key={label.id}>
                  <TableCell>
                    <span
                      className="inline-block size-4 rounded-full"
                      style={{ backgroundColor: label.color }}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{label.name}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditing(label);
                          setShowForm(true);
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(label.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog
          open={showForm}
          onOpenChange={(open) => {
            setShowForm(open);
            if (!open) setEditing(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit label" : "New label"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...form.register("name")} />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  {PRESET_COLORS.map((color) => (
                    <label key={color} className="cursor-pointer">
                      <input
                        type="radio"
                        value={color}
                        checked={form.watch("color") === color}
                        onChange={() => form.setValue("color", color)}
                        className="peer sr-only"
                      />
                      <span
                        className="block size-8 rounded-full border-2 border-transparent peer-checked:border-foreground"
                        style={{ backgroundColor: color }}
                      />
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditing(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">{editing ? "Save" : "Create"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
