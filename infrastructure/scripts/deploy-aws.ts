/**
 * Déploiements AWS via AWS SDK v3 (même approche que apps/api), sans AWS CLI.
 *
 * Usage (depuis la racine du repo) :
 *   bun infrastructure/scripts/deploy-aws.ts api <lambda-function-name>
 *   bun infrastructure/scripts/deploy-aws.ts frontend <dist-dir> <s3-bucket> <cloudfront-distribution-id>
 *   bun infrastructure/scripts/deploy-aws.ts assets <local-dir> <s3-bucket> [prefix]
 *   bun infrastructure/scripts/deploy-aws.ts backup-cron <environment> <api-url> <cron-secret> [schedule]
 *
 * Variables : LAMBDA_ENV_VARS (JSON) pour la commande api — identique à deploy-api.sh.
 * Chargement auto : `.env` à la racine puis `infrastructure/scripts/demo-local.env` (override),
 * pour AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY sans relancer le shell.
 */
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  type CreateBucketCommandInput,
} from "@aws-sdk/client-s3";
import {
  CloudFormationClient,
  CreateStackCommand,
  DescribeStacksCommand,
  UpdateStackCommand,
  type Parameter,
} from "@aws-sdk/client-cloudformation";
import {
  CreateInvalidationCommand,
  CloudFrontClient,
} from "@aws-sdk/client-cloudfront";
import {
  GetCallerIdentityCommand,
  STSClient,
} from "@aws-sdk/client-sts";
import {
  GetFunctionConfigurationCommand,
  LambdaClient,
  UpdateFunctionCodeCommand,
  UpdateFunctionConfigurationCommand,
} from "@aws-sdk/client-lambda";
import * as fs from "node:fs";
import * as path from "node:path";
import * as child_process from "node:child_process";
import * as os from "node:os";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "../..");

// Même source que le reste du repo : .env racine puis demo-local.env (override pour clés déploiement)
loadEnv({ path: path.join(REPO_ROOT, ".env") });
loadEnv({
  path: path.join(SCRIPT_DIR, "demo-local.env"),
  override: true,
});

function zipOneFile(cwd: string, entryName: string, outZipAbs: string): void {
  try {
    fs.unlinkSync(outZipAbs);
  } catch {
    /* no file */
  }
  child_process.execFileSync("zip", ["-jq", outZipAbs, entryName], {
    cwd,
    stdio: "inherit",
  });
}

function usage(msg?: string): never {
  if (msg) console.error(msg);
  console.error(`Usage:
  bun infrastructure/scripts/deploy-aws.ts api <lambda-name>
  bun infrastructure/scripts/deploy-aws.ts frontend <distDir> <bucket> <cloudFrontId>
  bun infrastructure/scripts/deploy-aws.ts assets <localDir> <bucket> [prefix]
  bun infrastructure/scripts/deploy-aws.ts backup-cron <env> <apiUrl> <cronSecret> [schedule]`);
  process.exit(1);
}

function walkFiles(rootDir: string): { rel: string; abs: string }[] {
  const out: { rel: string; abs: string }[] = [];
  const walk = (dir: string) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(abs);
      else if (ent.isFile())
        out.push({
          rel: path.relative(rootDir, abs).split(path.sep).join("/"),
          abs,
        });
    }
  };
  if (fs.existsSync(rootDir)) walk(rootDir);
  return out;
}

/** S3 key uses / */
function normalizePrefix(p: string): string {
  let s = p.replace(/^\/+/, "").replace(/\/+$/, "");
  return s ? `${s}/` : "";
}

async function listAllObjectKeys(
  client: S3Client,
  bucket: string,
  prefix: string,
): Promise<string[]> {
  const keys: string[] = [];
  let token: string | undefined;
  const p = normalizePrefix(prefix).replace(/\/$/, "");
  const listPrefix = p ? `${p}/` : "";
  do {
    const out = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: listPrefix || undefined,
        ContinuationToken: token,
      }),
    );
    for (const o of out.Contents ?? []) {
      if (o.Key) keys.push(o.Key);
    }
    token = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

async function syncS3Prefix(options: {
  client: S3Client;
  bucket: string;
  /** Clés S3 = keyPrefix + relPath (ex. assets/ ou static/) */
  keyPrefix: string;
  localRoot: string;
  cacheControl: string;
  deleteRemoved: boolean;
  /** Si défini, ne garde que les fichiers dont rel match */
  include?: (rel: string) => boolean;
}): Promise<void> {
  const {
    client,
    bucket,
    localRoot,
    cacheControl,
    deleteRemoved,
    include,
  } = options;
  const keyPrefix = normalizePrefix(options.keyPrefix);

  const allLocal = walkFiles(localRoot).filter((f) => !include || include(f.rel));
  const localKeys = new Set<string>();
  for (const f of allLocal) {
    const key = `${keyPrefix}${f.rel}`.replace(/\/+/g, "/");
    localKeys.add(key);
    const body = fs.readFileSync(f.abs);
    console.log(`  put s3://${bucket}/${key}`);
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        CacheControl: cacheControl,
      }),
    );
  }

  if (!deleteRemoved) return;

  const listPrefix = keyPrefix.replace(/\/$/, "");
  const remoteKeys = await listAllObjectKeys(
    client,
    bucket,
    listPrefix ? `${listPrefix}/` : "",
  );
  for (const key of remoteKeys) {
    if (!localKeys.has(key)) {
      console.log(`  delete s3://${bucket}/${key}`);
      await client.send(
        new DeleteObjectCommand({ Bucket: bucket, Key: key }),
      );
    }
  }
}

async function waitLambdaUpdated(
  client: LambdaClient,
  functionName: string,
): Promise<void> {
  for (let i = 0; i < 150; i++) {
    const cfg = await client.send(
      new GetFunctionConfigurationCommand({ FunctionName: functionName }),
    );
    const st = cfg.LastUpdateStatus;
    if (st === "Successful") return;
    if (st === "Failed")
      throw new Error(
        cfg.LastUpdateStatusReason ?? "Lambda LastUpdateStatus Failed",
      );
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("Timeout waiting for Lambda function update");
}

async function cmdApi(lambdaName: string): Promise<void> {
  if (!lambdaName) usage();

  const region = process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? "eu-west-3";
  const lambda = new LambdaClient({ region });

  console.log("Building Lambda bundle...");
  child_process.execSync("bun run build:lambda", {
    cwd: path.join(REPO_ROOT, "apps/api"),
    stdio: "inherit",
  });

  const indexPath = path.join(REPO_ROOT, "apps/api/dist/index.js");
  if (!fs.existsSync(indexPath)) {
    throw new Error(`Missing ${indexPath} after build:lambda`);
  }

  const distDir = path.join(REPO_ROOT, "apps/api/dist");
  const zipPath = path.join(distDir, "lambda.zip");
  console.log("Creating deployment package (zip)…");
  zipOneFile(distDir, "index.js", zipPath);
  const zipBuf = fs.readFileSync(zipPath);

  console.log("Updating Lambda function code…");
  await lambda.send(
    new UpdateFunctionCodeCommand({
      FunctionName: lambdaName,
      ZipFile: zipBuf,
    }),
  );
  await waitLambdaUpdated(lambda, lambdaName);

  const raw = process.env.LAMBDA_ENV_VARS;
  if (raw && raw.trim()) {
    console.log("Merging Lambda environment variables…");
    let patch: Record<string, string>;
    try {
      patch = JSON.parse(raw) as Record<string, string>;
    } catch {
      throw new Error("LAMBDA_ENV_VARS doit être du JSON valide");
    }
    const existing = await lambda.send(
      new GetFunctionConfigurationCommand({ FunctionName: lambdaName }),
    );
    const merged = { ...(existing.Environment?.Variables ?? {}), ...patch };
    await lambda.send(
      new UpdateFunctionConfigurationCommand({
        FunctionName: lambdaName,
        Environment: { Variables: merged },
      }),
    );
  }

  console.log("Deploy API complete.");
}

async function cmdFrontend(
  distDir: string,
  bucket: string,
  distributionId: string,
): Promise<void> {
  if (!distDir || !bucket || !distributionId) usage();

  const absDist = path.isAbsolute(distDir) ? distDir : path.join(REPO_ROOT, distDir);
  const region = process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? "eu-west-3";
  const s3 = new S3Client({ region });
  const cf = new CloudFrontClient({ region: "us-east-1" }); // CloudFront API global

  const assetsDir = path.join(absDist, "assets");
  if (fs.existsSync(assetsDir)) {
    console.log("Syncing hashed assets (immutable cache)…");
    await syncS3Prefix({
      client: s3,
      bucket,
      keyPrefix: "assets",
      localRoot: assetsDir,
      cacheControl: "public, max-age=31536000, immutable",
      deleteRemoved: true,
    });
  }

  console.log("Syncing root files (no-cache)…");
  const rootFiles = walkFiles(absDist).filter(
    (f) => !f.rel.startsWith("assets/") && f.rel !== "assets",
  );
  const rootKeys = new Set(rootFiles.map((f) => f.rel));
  for (const f of rootFiles) {
    console.log(`  put s3://${bucket}/${f.rel}`);
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: f.rel,
        Body: fs.readFileSync(f.abs),
        CacheControl: "no-cache, no-store, must-revalidate",
      }),
    );
  }

  const remoteRoot = await listAllObjectKeys(s3, bucket, "");
  for (const key of remoteRoot) {
    if (key.startsWith("assets/")) continue;
    if (!rootKeys.has(key)) {
      console.log(`  delete s3://${bucket}/${key}`);
      await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    }
  }

  console.log("Invalidating CloudFront…");
  await cf.send(
    new CreateInvalidationCommand({
      DistributionId: distributionId,
      InvalidationBatch: {
        CallerReference: `${Date.now()}`,
        Paths: { Quantity: 1, Items: ["/*"] },
      },
    }),
  );

  console.log("Deploy frontend complete.");
}

async function cmdAssets(
  localDir: string,
  bucket: string,
  prefixArg?: string,
): Promise<void> {
  if (!localDir || !bucket) usage();
  const prefix = prefixArg ?? "static";
  const absLocal = path.isAbsolute(localDir)
    ? localDir
    : path.join(REPO_ROOT, localDir);
  if (!fs.statSync(absLocal).isDirectory()) {
    throw new Error(`Not a directory: ${absLocal}`);
  }

  const region = process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? "eu-west-3";
  const s3 = new S3Client({ region });

  console.log(`Syncing ${absLocal} -> s3://${bucket}/${normalizePrefix(prefix)} (public cache)…`);
  await syncS3Prefix({
    client: s3,
    bucket,
    keyPrefix: prefix,
    localRoot: absLocal,
    cacheControl: "public, max-age=604800",
    deleteRemoved: false,
  });
  console.log("Deploy static assets complete.");
}

async function ensureBucket(client: S3Client, bucket: string, region: string): Promise<void> {
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch {
    const input: CreateBucketCommandInput = { Bucket: bucket };
    if (region && region !== "us-east-1") {
      input.CreateBucketConfiguration = {
        LocationConstraint: region as import("@aws-sdk/client-s3").BucketLocationConstraint,
      };
    }
    console.log(`  create bucket s3://${bucket} (${region})`);
    await client.send(new CreateBucketCommand(input));
  }
}

async function waitCfnStack(
  client: CloudFormationClient,
  stackName: string,
): Promise<void> {
  for (let i = 0; i < 200; i++) {
    const d = await client.send(
      new DescribeStacksCommand({ StackName: stackName }),
    );
    const s = d.Stacks?.[0];
    const status = s?.StackStatus ?? "";
    if (status.endsWith("_COMPLETE") && !status.includes("ROLLBACK")) return;
    if (
      status.includes("FAILED") ||
      (status.includes("ROLLBACK") && status !== "UPDATE_ROLLBACK_COMPLETE")
    ) {
      throw new Error(`CloudFormation ${status}: ${s?.StackStatusReason ?? ""}`);
    }
    await new Promise((r) => setTimeout(r, 4000));
  }
  throw new Error("Timeout waiting for CloudFormation stack");
}

async function cmdBackupCron(
  environment: string,
  apiUrl: string,
  cronSecret: string,
  schedule: string,
): Promise<void> {
  if (!environment || !apiUrl || !cronSecret) usage();

  const infraDir = path.join(REPO_ROOT, "infrastructure");
  const cfTemplatePath = path.join(infraDir, "cloudformation/backup-cron.yml");
  const lambdaSrc = path.join(infraDir, "lambda/backup-cron/index.mjs");

  let region = process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? "eu-west-1";
  const configFile = path.join(
    infraDir,
    "environments",
    environment,
    "config.json",
  );
  if (fs.existsSync(configFile)) {
    try {
      const j = JSON.parse(fs.readFileSync(configFile, "utf8")) as {
        aws?: { region?: string };
      };
      if (j.aws?.region) region = j.aws.region;
    } catch {
      /* ignore */
    }
  }

  const sts = new STSClient({ region });
  const id = await sts.send(new GetCallerIdentityCommand({}));
  const account = id.Account;
  if (!account) throw new Error("STS GetCallerIdentity: no account");
  const deployBucket = `${environment}-lambda-deployments-${account}`;
  const s3Key = "lambda/backup-cron.zip";
  const stackName = `${environment}-backup-cron`;

  console.log("==> Packaging Lambda…");
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "backup-cron-"));
  let zipBuf: Buffer;
  try {
    fs.copyFileSync(lambdaSrc, path.join(tmpDir, "index.mjs"));
    const zipPath = path.join(tmpDir, "backup-cron.zip");
    zipOneFile(tmpDir, "index.mjs", zipPath);
    zipBuf = fs.readFileSync(zipPath);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  const s3 = new S3Client({ region });
  console.log(`==> Ensuring bucket s3://${deployBucket}…`);
  await ensureBucket(s3, deployBucket, region);

  console.log(`==> Uploading s3://${deployBucket}/${s3Key}…`);
  await s3.send(
    new PutObjectCommand({
      Bucket: deployBucket,
      Key: s3Key,
      Body: zipBuf,
    }),
  );

  const templateBody = fs.readFileSync(cfTemplatePath, "utf8");
  const params: Parameter[] = [
    { ParameterKey: "Environment", ParameterValue: environment },
    { ParameterKey: "ApiUrl", ParameterValue: apiUrl },
    { ParameterKey: "CronSecret", ParameterValue: cronSecret },
    { ParameterKey: "ScheduleExpression", ParameterValue: schedule },
    { ParameterKey: "LambdaS3Bucket", ParameterValue: deployBucket },
    { ParameterKey: "LambdaS3Key", ParameterValue: s3Key },
  ];

  const cfn = new CloudFormationClient({ region });
  let stackExists = false;
  try {
    await cfn.send(new DescribeStacksCommand({ StackName: stackName }));
    stackExists = true;
  } catch {
    stackExists = false;
  }

  console.log(`==> CloudFormation ${stackExists ? "UpdateStack" : "CreateStack"} ${stackName}…`);
  try {
    if (stackExists) {
      await cfn.send(
        new UpdateStackCommand({
          StackName: stackName,
          TemplateBody: templateBody,
          Parameters: params,
          Capabilities: ["CAPABILITY_NAMED_IAM"],
        }),
      );
    } else {
      await cfn.send(
        new CreateStackCommand({
          StackName: stackName,
          TemplateBody: templateBody,
          Parameters: params,
          Capabilities: ["CAPABILITY_NAMED_IAM"],
        }),
      );
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (
      stackExists &&
      (msg.includes("No updates are to be performed") ||
        msg.includes("does not differ"))
    ) {
      console.log("   (aucun changement CloudFormation — OK)");
      console.log("==> Done!");
      return;
    }
    throw e;
  }

  await waitCfnStack(cfn, stackName);
  console.log(`==> Done! Stack: ${stackName} (${region})`);
  console.log(`    Schedule: ${schedule}`);
  console.log(`    API URL:  ${apiUrl}`);
}

async function main(): Promise<void> {
  const [, , cmd, ...rest] = process.argv;
  if (!cmd) usage();

  switch (cmd) {
    case "api":
      await cmdApi(rest[0] ?? "");
      break;
    case "frontend":
      await cmdFrontend(rest[0] ?? "", rest[1] ?? "", rest[2] ?? "");
      break;
    case "assets":
      await cmdAssets(rest[0] ?? "", rest[1] ?? "", rest[2]);
      break;
    case "backup-cron":
      await cmdBackupCron(
        rest[0] ?? "",
        rest[1] ?? "",
        rest[2] ?? "",
        rest[3] ?? "rate(1 hour)",
      );
      break;
    default:
      usage(`Unknown command: ${cmd}`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
