import { randomBytes } from "node:crypto";
import { gzipSync } from "node:zlib";
import pg from "pg";
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
import { env } from "../env";

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

function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

function pickDollarTag(content: string): string {
  for (let i = 0; i < 32; i++) {
    const tag = `$b${randomBytes(6).toString("hex")}$`;
    if (!content.includes(tag)) return tag;
  }
  throw new Error("Could not find a safe dollar-quote delimiter for SQL backup");
}

/**
 * Topological order: parent table before child (FK targets first).
 * FK checks run at end of each statement; self-referential rows can load in one INSERT.
 */
function orderTablesByFk(
  tables: string[],
  edges: Array<{ parent: string; child: string }>,
): string[] {
  const set = new Set(tables);
  const inDegree = new Map<string, number>();
  const outbound = new Map<string, string[]>();

  for (const t of tables) {
    inDegree.set(t, 0);
    outbound.set(t, []);
  }

  for (const { parent, child } of edges) {
    if (!set.has(parent) || !set.has(child) || parent === child) continue;
    outbound.get(parent)!.push(child);
    inDegree.set(child, (inDegree.get(child) ?? 0) + 1);
  }

  const queue = tables.filter((t) => inDegree.get(t) === 0).sort();
  const sorted: string[] = [];

  while (queue.length) {
    const t = queue.shift()!;
    sorted.push(t);
    for (const c of outbound.get(t)!) {
      const next = (inDegree.get(c) ?? 0) - 1;
      inDegree.set(c, next);
      if (next === 0) {
        queue.push(c);
        queue.sort();
      }
    }
  }

  if (sorted.length !== tables.length) {
    throw new Error(
      "Circular foreign-key dependencies between tables; cannot order backup statements",
    );
  }

  return sorted;
}

/**
 * Logical data-only SQL backup using native queries (no pg_dump).
 * Uses json_agg + json_populate_recordset so literals are built server-side.
 */
async function buildDataSqlBackupGzip(databaseUrl: string): Promise<Buffer> {
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const { rows: tableRows } = await client.query<{ name: string }>(`
      SELECT c.relname AS name
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relkind = 'r'
        AND NOT c.relispartition
      ORDER BY c.relname
    `);

    const tables = tableRows.map((r) => r.name);
    if (tables.length === 0) {
      throw new Error("No user tables found in schema public");
    }

    const { rows: fkRows } = await client.query<{ parent: string; child: string }>(`
      SELECT DISTINCT
        ccu.table_name AS parent,
        tc.table_name AS child
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
    `);

    const orderedNames = orderTablesByFk(tables, fkRows);

    const lines: string[] = [
      "-- PostgreSQL data-only backup (SQL from native SELECT/json_agg, not pg_dump)",
      "-- Restore into an empty database that already has the same schema (migrations applied).",
      `-- Generated at: ${new Date().toISOString()}`,
      "BEGIN;",
      "",
    ];

    for (const name of orderedNames) {
      const qi = quoteIdent(name);
      const { rows } = await client.query<{ j: string }>(
        `SELECT coalesce(json_agg(row_to_json(x)), '[]')::text AS j FROM (SELECT * FROM ${qi}) x`,
      );
      const jsonText = rows[0]?.j ?? "[]";
      const tag = pickDollarTag(jsonText);
      lines.push(
        `INSERT INTO ${qi} SELECT * FROM json_populate_recordset(NULL::${qi}, ${tag}${jsonText}${tag}::json);`,
        "",
      );
    }

    lines.push("COMMIT;", "");

    const sql = lines.join("\n");
    const compressed = gzipSync(Buffer.from(sql, "utf8"));
    if (compressed.length < 30) {
      throw new Error("Backup compression produced empty output");
    }
    return compressed;
  } finally {
    await client.end();
  }
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
    const databaseUrl = env.BACKUP_DATABASE_URL;

    const compressedData = await buildDataSqlBackupGzip(databaseUrl);

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

  const envBucket = process.env.BACKUP_S3_BUCKET ?? "";
  const envRegion = process.env.S3_REGION ?? "eu-west-3";

  if (!config) {
    // Create default config
    const defaultConfig = {
      id: "default",
      enabled: false,
      cronExpression: "0 * * * *",
      s3Bucket: envBucket,
      s3Region: envRegion,
    };
    await db.insert(schema.backupConfig).values(defaultConfig);
    return {
      ...defaultConfig,
      lastRunAt: null,
      updatedAt: new Date(),
    };
  }

  // Lignes créées avant BACKUP_S3_BUCKET en env peuvent avoir s3_bucket vide en base ;
  // sans ce repli, runBackup() échoue alors que les variables d’environnement sont bonnes.
  return {
    ...config,
    s3Bucket: config.s3Bucket.trim() ? config.s3Bucket : envBucket,
    s3Region: config.s3Region.trim() ? config.s3Region : envRegion,
  };
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
