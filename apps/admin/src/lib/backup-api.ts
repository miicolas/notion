import { apiFetch } from "./api-client";

export type Backup = {
  id: string;
  filename: string;
  s3Key: string;
  sizeBytes: number;
  status: "pending" | "completed" | "failed";
  error: string | null;
  createdAt: string;
};

export type BackupConfig = {
  id: string;
  enabled: boolean;
  cronExpression: string;
  s3Bucket: string;
  s3Region: string;
  lastRunAt: string | null;
  updatedAt: string;
};

export function fetchBackups() {
  return apiFetch<Array<Backup>>("/api/admin/backups");
}

export function fetchBackupConfig() {
  return apiFetch<BackupConfig>("/api/admin/backups/config");
}

export function triggerBackup() {
  return apiFetch<{ id: string; filename: string; sizeBytes: number }>(
    "/api/admin/backups",
    { method: "POST" },
  );
}

export function deleteBackup(id: string) {
  return apiFetch<{ ok: boolean }>(`/api/admin/backups/${id}`, {
    method: "DELETE",
  });
}

export function fetchDownloadUrl(id: string) {
  return apiFetch<{ downloadUrl: string }>(`/api/admin/backups/${id}/download`);
}

export function updateBackupConfig(data: Partial<BackupConfig>) {
  return apiFetch<BackupConfig>("/api/admin/backups/config", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
