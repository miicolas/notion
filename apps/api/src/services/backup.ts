import { spawn } from "child_process";
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

function generateId() {
  return crypto.randomUUID();
}

const s3Clients = new Map<string, S3Client>();

function getS3Client(region: string) {
  let client = s3Clients.get(region);
  if (!client) {
    client = new S3Client({ region });
    s3Clients.set(region, client);
  }
  return client;
}

let backupInProgress = false;

function runPgDumpGzip(databaseUrl: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const pgDump = spawn("pg_dump", [databaseUrl], { stdio: ["ignore", "pipe", "pipe"] });
    const gzip = spawn("gzip", [], { stdio: ["pipe", "pipe", "pipe"] });

    pgDump.stdout.pipe(gzip.stdin);

    const chunks: Buffer[] = [];
    gzip.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));

    let pgDumpError = "";
    pgDump.stderr.on("data", (data: Buffer) => { pgDumpError += data.toString(); });

    let gzipError = "";
    gzip.stderr.on("data", (data: Buffer) => { gzipError += data.toString(); });

    gzip.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(pgDumpError || gzipError || `pg_dump/gzip exited with code ${code}`));
      } else {
        resolve(Buffer.concat(chunks));
      }
    });

    pgDump.on("error", reject);
    gzip.on("error", reject);
  });
}

export async function runBackup() {
  if (backupInProgress) {
    throw new Error("A backup is already in progress");
  }

  const config = await getBackupConfig();
  if (!config.s3Bucket) {
    throw new Error("S3 bucket not configured");
  }

  backupInProgress = true;
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

    // Run pg_dump piped to gzip (no shell interpolation)
    const compressedData = await runPgDumpGzip(databaseUrl);

    // Upload to S3
    const s3 = getS3Client(config.s3Region);
    await s3.send(
      new PutObjectCommand({
        Bucket: config.s3Bucket,
        Key: s3Key,
        Body: compressedData,
        ContentType: "application/gzip",
      }),
    );

    // Update record
    await db
      .update(schema.dbBackup)
      .set({
        sizeBytes: compressedData.length,
        status: "completed",
      })
      .where(eq(schema.dbBackup.id, id));

    // Update last run time
    await db
      .update(schema.backupConfig)
      .set({ lastRunAt: now })
      .where(eq(schema.backupConfig.id, "default"));

    return { id, filename, sizeBytes: compressedData.length };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    await db
      .update(schema.dbBackup)
      .set({ status: "failed", error: errorMsg })
      .where(eq(schema.dbBackup.id, id));
    throw err;
  } finally {
    backupInProgress = false;
  }
}

export async function listBackups() {
  const backups = await db
    .select()
    .from(schema.dbBackup)
    .orderBy(desc(schema.dbBackup.createdAt))
    .limit(100);

  return backups;
}

export async function getBackupDownloadUrl(id: string) {
  const backup = await db.query.dbBackup.findFirst({
    where: eq(schema.dbBackup.id, id),
  });
  if (!backup || backup.status !== "completed") return null;

  const config = await getBackupConfig();
  if (!config.s3Bucket) return null;

  const s3 = getS3Client(config.s3Region);
  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: config.s3Bucket,
      Key: backup.s3Key,
    }),
    { expiresIn: 3600 },
  );
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
  // Ensure default config exists
  await getBackupConfig();

  await db
    .update(schema.backupConfig)
    .set(data)
    .where(eq(schema.backupConfig.id, "default"));

  // Re-fetch to return fresh data with correct updatedAt
  return getBackupConfig();
}
