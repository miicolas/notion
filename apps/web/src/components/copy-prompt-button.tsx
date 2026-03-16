import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { copyIssueAsPrompt } from "@/lib/copy-issue-prompt";
import type { Issue } from "@/lib/types";

export function CopyPromptButton({
  issue,
  showLabel = false,
}: {
  issue: Issue;
  showLabel?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    await copyIssueAsPrompt(issue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (showLabel) {
    return (
      <Button variant="outline" onClick={handleCopy}>
        {copied ? (
          <Check className="mr-2 size-4" />
        ) : (
          <Copy className="mr-2 size-4" />
        )}
        {copied ? "Copied!" : "Copy as prompt"}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-7"
      onClick={handleCopy}
      title="Copy as prompt"
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </Button>
  );
}
