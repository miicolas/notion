import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Database,
  Download,
  Loader2,
  Play,
  Settings,
  Trash2,
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";
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
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Switch } from "@workspace/ui/components/switch";
import { Badge } from "@workspace/ui/components/badge";
import {
  fetchBackups,
  fetchBackupConfig,
  triggerBackup,
  deleteBackup,
  updateBackupConfig,
  type Backup,
  type BackupConfig,
} from "@/lib/backup-api";

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function StatusBadge({ status }: { status: Backup["status"] }) {
  const variant =
    status === "completed"
      ? "default"
      : status === "pending"
        ? "secondary"
        : "destructive";
  return <Badge variant={variant}>{status}</Badge>;
}

export function BackupsPage() {
  const queryClient = useQueryClient();

  const { data: backups, isLoading: loadingBackups } = useQuery({
    queryKey: ["admin", "backups"],
    queryFn: fetchBackups,
    refetchInterval: 5000,
  });

  const { data: config, isLoading: loadingConfig } = useQuery({
    queryKey: ["admin", "backups", "config"],
    queryFn: fetchBackupConfig,
  });

  const triggerMutation = useMutation({
    mutationFn: triggerBackup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "backups"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBackup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "backups"] });
    },
  });

  const configMutation = useMutation({
    mutationFn: updateBackupConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "backups", "config"],
      });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Database Backups</h1>
        <Button
          onClick={() => triggerMutation.mutate()}
          disabled={triggerMutation.isPending}
        >
          {triggerMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          Run Backup Now
        </Button>
      </div>

      {triggerMutation.isError && (
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          Backup failed: {triggerMutation.error.message}
        </div>
      )}

      {/* Cron Configuration */}
      <CronConfigCard
        config={config}
        isLoading={loadingConfig}
        onUpdate={(data) => configMutation.mutate(data)}
        isSaving={configMutation.isPending}
      />

      {/* Backups Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Backup History
          </CardTitle>
          <CardDescription>
            Liste des sauvegardes de la base de données
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingBackups ? (
            <div className="flex justify-center py-8">
              <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
            </div>
          ) : !backups?.length ? (
            <p className="text-muted-foreground py-8 text-center">
              Aucun backup pour le moment.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Heure</TableHead>
                  <TableHead>Fichier</TableHead>
                  <TableHead>Taille</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backups.map((backup) => (
                  <TableRow key={backup.id}>
                    <TableCell>
                      {format(new Date(backup.createdAt), "dd MMM yyyy", {
                        locale: fr,
                      })}
                    </TableCell>
                    <TableCell>
                      {format(new Date(backup.createdAt), "HH:mm:ss")}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {backup.filename}
                    </TableCell>
                    <TableCell>{formatBytes(backup.sizeBytes)}</TableCell>
                    <TableCell>
                      <StatusBadge status={backup.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {backup.downloadUrl && (
                          <Button variant="outline" size="sm" asChild>
                            <a
                              href={backup.downloadUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteMutation.mutate(backup.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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

function CronConfigCard({
  config,
  isLoading,
  onUpdate,
  isSaving,
}: {
  config: BackupConfig | undefined;
  isLoading: boolean;
  onUpdate: (data: Partial<BackupConfig>) => void;
  isSaving: boolean;
}) {
  const [cronExpression, setCronExpression] = useState("");
  const [s3Bucket, setS3Bucket] = useState("");
  const [s3Region, setS3Region] = useState("");

  // Sync local state with fetched config
  const initialized = useState(false);
  if (config && !initialized[0]) {
    setCronExpression(config.cronExpression);
    setS3Bucket(config.s3Bucket);
    setS3Region(config.s3Region);
    initialized[1](true);
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Cron Configuration
        </CardTitle>
        <CardDescription>
          Configurer la sauvegarde automatique de la base de données
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Switch
            checked={config?.enabled ?? false}
            onCheckedChange={(enabled) => onUpdate({ enabled })}
          />
          <Label>
            {config?.enabled
              ? "Backup automatique activé"
              : "Backup automatique désactivé"}
          </Label>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="cron">Expression Cron</Label>
            <Input
              id="cron"
              placeholder="0 * * * *"
              value={cronExpression}
              onChange={(e) => setCronExpression(e.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              Ex: "0 * * * *" = toutes les heures, "0 0 * * *" = tous les jours
              à minuit
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bucket">S3 Bucket</Label>
            <Input
              id="bucket"
              placeholder="my-db-backups"
              value={s3Bucket}
              onChange={(e) => setS3Bucket(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="region">AWS Region</Label>
            <Input
              id="region"
              placeholder="eu-west-1"
              value={s3Region}
              onChange={(e) => setS3Region(e.target.value)}
            />
          </div>
        </div>

        {config?.lastRunAt && (
          <p className="text-muted-foreground text-sm">
            Dernier backup :{" "}
            {format(new Date(config.lastRunAt), "dd MMM yyyy à HH:mm", {
              locale: fr,
            })}
          </p>
        )}

        <Button
          onClick={() =>
            onUpdate({
              cronExpression,
              s3Bucket,
              s3Region,
            })
          }
          disabled={isSaving}
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sauvegarder la configuration
        </Button>
      </CardContent>
    </Card>
  );
}
