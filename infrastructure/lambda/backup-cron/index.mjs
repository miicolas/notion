/**
 * AWS Lambda handler triggered by EventBridge Scheduler.
 * Calls the API's /api/cron/backup endpoint with the CRON_SECRET.
 *
 * Environment variables:
 *   - API_URL: Base URL of the API (e.g. https://api.example.com)
 *   - CRON_SECRET: Shared secret for authenticating cron requests
 */

export const handler = async (event) => {
  const apiUrl = process.env.API_URL;
  const cronSecret = process.env.CRON_SECRET;

  if (!apiUrl || !cronSecret) {
    console.error("Missing required env vars: API_URL and/or CRON_SECRET");
    return { statusCode: 500, body: "Missing configuration" };
  }

  const url = `${apiUrl.replace(/\/$/, "")}/api/cron/backup`;

  console.log(`[backup-cron-lambda] Triggering backup at ${url}`);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "x-cron-secret": cronSecret,
        "Content-Type": "application/json",
      },
    });

    const body = await response.json();

    if (!response.ok) {
      console.error(`[backup-cron-lambda] API returned ${response.status}:`, body);
      return { statusCode: response.status, body: JSON.stringify(body) };
    }

    console.log("[backup-cron-lambda] Backup triggered successfully:", body);
    return { statusCode: 200, body: JSON.stringify(body) };
  } catch (err) {
    console.error("[backup-cron-lambda] Request failed:", err.message);
    return { statusCode: 500, body: err.message };
  }
};
