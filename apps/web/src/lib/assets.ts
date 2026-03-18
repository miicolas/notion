import { apiFetch } from "./api-client";
import type { Asset } from "./types";

export async function requestPresignedUrl(data: {
  filename: string;
  mimeType: string;
  size: number;
}): Promise<{ uploadUrl: string; key: string; assetId: string; mimeType: string }> {
  return apiFetch("/api/assets/presign", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function confirmUpload(data: {
  assetId: string;
  key: string;
  filename: string;
  mimeType: string;
  size: number;
  issueId?: string;
  commentId?: string;
}): Promise<Asset> {
  return apiFetch("/api/assets/confirm", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getDownloadUrl(
  assetId: string,
): Promise<{ url: string }> {
  return apiFetch(`/api/assets/${assetId}/download`);
}

export async function deleteAsset(assetId: string): Promise<void> {
  return apiFetch(`/api/assets/${assetId}`, { method: "DELETE" });
}

export async function uploadFile(
  file: File,
  opts?: { issueId?: string; commentId?: string },
): Promise<Asset> {
  const { uploadUrl, key, assetId, mimeType } = await requestPresignedUrl({
    filename: file.name,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
  });

  const res = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": mimeType },
  });

  if (!res.ok) {
    throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
  }

  return confirmUpload({
    assetId,
    key,
    filename: file.name,
    mimeType: file.type,
    size: file.size,
    ...opts,
  });
}
