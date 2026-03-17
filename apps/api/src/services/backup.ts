import { exec } from "child_process";
import { promisify } from "util";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { db } from "../db";
import * as schema from "../db/schema";
import { eq, desc } from "drizzle-orm";

const execAsync = promisify(exec);

function generateId() {
  return crypto.randomUUID();
}

function getS3Client(region: string) {
  return new S3Client({ region });
}

export async function runBackup() {
  const config = await getBackupConfig();
  if (!config.s3Bucket) {
    throw new Error("S3 bucket not configured");
  }

  const id = generateId();
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, "-");
  const filename = `backup-${timestamp}.sql.gz`;
  const s3Key = `backups/${filename}`;

  // Insert pending record
  await db.insert(schema.dbBackup).values({
    id,
    filename,
    s3Key,
    sizeBytes: 0,
    status: "pending",
  });

  try {
    const databaseUrl = process.env.DATABASE_URL!;

    // Run pg_dump and gzip
    const { stdout } = await execAsync(
      `pg_dump "${databaseUrl}" | gzip`,
      { encoding: "buffer", maxBuffer: 500 * 1024 * 1024 },
    );

    // Upload to S3
    const s3 = getS3Client(config.s3Region);
    await s3.send(
      new PutObjectCommand({
        Bucket: config.s3Bucket,
        Key: s3Key,
        Body: stdout,
        ContentType: "application/gzip",
      }),
    );

    // Update record
    await db
      .update(schema.dbBackup)
      .set({
        sizeBytes: stdout.length,
        status: "completed",
      })
      .where(eq(schema.dbBackup.id, id));

    // Update last run time
    await db
      .update(schema.backupConfig)
      .set({ lastRunAt: now })
      .where(eq(schema.backupConfig.id, "default"));

    return { id, filename, sizeBytes: stdout.length };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    await db
      .update(schema.dbBackup)
      .set({ status: "failed", error: errorMsg })
      .where(eq(schema.dbBackup.id, id));
    throw err;
  }
}

export async function listBackups() {
  const config = await getBackupConfig();
  const backups = await db
    .select()
    .from(schema.dbBackup)
    .orderBy(desc(schema.dbBackup.createdAt))
    .limit(100);

  if (!config.s3Bucket) {
    return backups.map((b) => ({ ...b, downloadUrl: null }));
  }

  const s3 = getS3Client(config.s3Region);

  const enriched = await Promise.all(
    backups.map(async (b) => {
      let downloadUrl: string | null = null;
      if (b.status === "completed") {
        try {
          downloadUrl = await getSignedUrl(
            s3,
            new GetObjectCommand({
              Bucket: config.s3Bucket,
              Key: b.s3Key,
            }),
            { expiresIn: 3600 },
          );
        } catch {
          // S3 might not be reachable in dev
        }
      }
      return { ...b, downloadUrl };
    }),
  );

  return enriched;
}

export async function deleteBackup(id: string) {
  const backup = await db.query.dbBackup.findFirst({
    where: eq(schema.dbBackup.id, id),
  });
  if (!backup) throw new Error("Backup not found");

  const config = await getBackupConfig();

  // Try to delete from S3
  if (config.s3Bucket && backup.status === "completed") {
    try {
      const s3 = getS3Client(config.s3Region);
      await s3.send(
        new DeleteObjectCommand({
          Bucket: config.s3Bucket,
          Key: backup.s3Key,
        }),
      );
    } catch {
      // Ignore S3 errors on delete
    }
  }

  await db.delete(schema.dbBackup).where(eq(schema.dbBackup.id, id));
}

export async function getBackupConfig() {
  const config = await db.query.backupConfig.findFirst({
    where: eq(schema.backupConfig.id, "default"),
  });

  if (!config) {
    // Create default config
    const defaultConfig = {
      id: "default",
      enabled: false,
      cronExpression: "0 * * * *",
      s3Bucket: process.env.BACKUP_S3_BUCKET ?? "",
      s3Region: process.env.AWS_REGION ?? "eu-west-1",
    };
    await db.insert(schema.backupConfig).values(defaultConfig);
    return {
      ...defaultConfig,
      lastRunAt: null,
      updatedAt: new Date(),
    };
  }

  return config;
}

export async function updateBackupConfig(data: {
  enabled?: boolean;
  cronExpression?: string;
  s3Bucket?: string;
  s3Region?: string;
}) {
  const existing = await getBackupConfig();

  await db
    .update(schema.backupConfig)
    .set(data)
    .where(eq(schema.backupConfig.id, "default"));

  return { ...existing, ...data };
}
