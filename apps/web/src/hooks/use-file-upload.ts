import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { uploadFile } from "@/lib/assets";
import type { Asset } from "@/lib/types";

type PendingFile = {
  id: string;
  file: File;
  preview?: string;
};

export function useFileUpload() {
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [uploadedAssets, setUploadedAssets] = useState<Asset[]>([]);

  const addFiles = useCallback((files: FileList | File[]) => {
    const newFiles = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : undefined,
    }));
    setPendingFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const removeFile = useCallback((id: string) => {
    setPendingFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.preview) URL.revokeObjectURL(file.preview);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const uploadMutation = useMutation({
    mutationFn: async (opts: { issueId?: string; commentId?: string }) => {
      const assets: Asset[] = [];
      for (const pending of pendingFiles) {
        const asset = await uploadFile(pending.file, opts);
        assets.push(asset);
      }
      return assets;
    },
    onSuccess: (assets) => {
      pendingFiles.forEach((f) => {
        if (f.preview) URL.revokeObjectURL(f.preview);
      });
      setUploadedAssets(assets);
      setPendingFiles([]);
    },
  });

  const reset = useCallback(() => {
    pendingFiles.forEach((f) => {
      if (f.preview) URL.revokeObjectURL(f.preview);
    });
    setPendingFiles([]);
    setUploadedAssets([]);
  }, [pendingFiles]);

  return {
    pendingFiles,
    uploadedAssets,
    addFiles,
    removeFile,
    uploadAll: (opts?: { issueId?: string; commentId?: string }) =>
      uploadMutation.mutateAsync(opts ?? {}),
    isUploading: uploadMutation.isPending,
    reset,
  };
}
