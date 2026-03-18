import cron, { type ScheduledTask } from "node-cron";
import { getBackupConfig, runBackup } from "./backup";
import { env } from "../env";

let currentTask: ScheduledTask | null = null;

export async function startBackupCron() {
  // In production with EventBridge, node-cron is not needed.
  // The /api/cron/backup endpoint handles scheduled invocations.
  if (env.CRON_SECRET) {
    console.log(
      "[backup-cron] CRON_SECRET is set — backups are managed by AWS EventBridge. " +
        "Local node-cron scheduler is disabled.",
    );
    return;
  }

  // Fallback: use node-cron for local development
  console.log("[backup-cron] No CRON_SECRET set — using local node-cron (dev mode)");
  await syncCron();
}

export async function syncCron() {
  // Stop existing task
  if (currentTask) {
    currentTask.stop();
    currentTask = null;
  }

  try {
    const config = await getBackupConfig();

    if (!config.enabled) {
      console.log("[backup-cron] Cron disabled");
      return;
    }

    if (!cron.validate(config.cronExpression)) {
      console.error(
        `[backup-cron] Invalid cron expression: ${config.cronExpression}`,
      );
      return;
    }

    currentTask = cron.schedule(config.cronExpression, async () => {
      console.log("[backup-cron] Running scheduled backup...");
      try {
        const result = await runBackup();
        console.log(
          `[backup-cron] Backup completed: ${result.filename} (${result.sizeBytes} bytes)`,
        );
      } catch (err) {
        console.error("[backup-cron] Backup failed:", err);
      }
    });

    console.log(
      `[backup-cron] Scheduled with expression: ${config.cronExpression}`,
    );
  } catch (err) {
    console.error("[backup-cron] Failed to start:", err);
  }
}
