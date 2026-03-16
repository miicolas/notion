import type { Issue } from "./types";

const statusLabels: Record<string, string> = {
  backlog: "Backlog",
  todo: "Todo",
  in_progress: "In Progress",
  done: "Done",
  cancelled: "Cancelled",
};

const priorityLabels: Record<string, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
  no_priority: "No priority",
};

export function formatIssueAsPrompt(issue: Issue): string {
  const lines: string[] = [];

  lines.push(`# ${issue.title}`);
  lines.push("");

  lines.push(`- **ID**: ${issue.id}`);
  lines.push(`- **Status**: ${statusLabels[issue.status] ?? issue.status}`);
  lines.push(
    `- **Priority**: ${priorityLabels[issue.priority] ?? issue.priority}`,
  );

  if (issue.project) {
    lines.push(`- **Project**: ${issue.project.name}`);
  }

  if (issue.assignee) {
    lines.push(`- **Assignee**: ${issue.assignee.user.name}`);
  }

  if (issue.deadline) {
    lines.push(
      `- **Deadline**: ${new Date(issue.deadline).toLocaleDateString()}`,
    );
  }

  if (issue.issueLabels && issue.issueLabels.length > 0) {
    const labels = issue.issueLabels.map((il) => il.label.name).join(", ");
    lines.push(`- **Labels**: ${labels}`);
  }

  if (issue.description) {
    lines.push("");
    lines.push("## Description");
    lines.push("");
    lines.push(issue.description);
  }

  if (issue.comments && issue.comments.length > 0) {
    lines.push("");
    lines.push("## Comments");
    lines.push("");
    for (const comment of issue.comments) {
      const date = new Date(comment.createdAt).toLocaleDateString();
      lines.push(`**${comment.author.name}** (${date}):`);
      lines.push(comment.content);
      lines.push("");
    }
  }

  return lines.join("\n");
}

export async function copyIssueAsPrompt(issue: Issue): Promise<void> {
  const text = formatIssueAsPrompt(issue);
  await navigator.clipboard.writeText(text);
}
