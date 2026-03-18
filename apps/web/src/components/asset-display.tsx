import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDownloadUrl } from "@/lib/assets";
import { Download, FileText } from "lucide-react";
import type { Asset } from "@/lib/types";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AssetDisplay({ asset }: { asset: Asset }) {
  const [loadUrl, setLoadUrl] = useState(false);
  const isImage = asset.mimeType.startsWith("image/");

  const { data } = useQuery({
    queryKey: ["asset-url", asset.id],
    queryFn: () => getDownloadUrl(asset.id),
    enabled: loadUrl || isImage,
    staleTime: 50 * 60 * 1000, // 50 min (URL valid for 1h)
  });

  if (isImage && data?.url) {
    return (
      <a href={data.url} target="_blank" rel="noopener noreferrer">
        <img
          src={data.url}
          alt={asset.filename}
          className="max-h-48 rounded-md border object-contain"
        />
      </a>
    );
  }

  if (isImage) {
    return (
      <div className="bg-muted flex h-20 w-32 items-center justify-center rounded-md border">
        <span className="text-muted-foreground text-xs">Loading...</span>
      </div>
    );
  }

  return (
    <a
      href={data?.url ?? "#"}
      onClick={(e) => {
        if (!data?.url) {
          e.preventDefault();
          setLoadUrl(true);
        }
      }}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-muted hover:bg-muted/80 flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors"
    >
      <FileText className="text-muted-foreground size-4" />
      <span className="max-w-[200px] truncate">{asset.filename}</span>
      <span className="text-muted-foreground text-xs">
        {formatFileSize(asset.size)}
      </span>
      <Download className="text-muted-foreground size-3.5" />
    </a>
  );
}
