import * as React from "react";
import {
  DndContext,
  
  
  DragOverlay,
  
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Link } from "react-router-dom";
import {
  
  IssueStatusIcon,
  statusConfig
} from "./issue-status-icon";
import { IssuePriorityIcon  } from "./issue-priority-icon";
import { LabelBadge } from "./label-badge";
import { UserAvatar } from "./user-avatar";
import { CopyPromptButton } from "./copy-prompt-button";
import type {IssueStatus} from "./issue-status-icon";
import type {Priority} from "./issue-priority-icon";
import type {DragEndEvent, DragOverEvent, DragStartEvent} from "@dnd-kit/core";
import type { Issue } from "@/lib/types";
import { reorderIssue } from "@/lib/issues";

const COLUMNS: Array<IssueStatus> = [
  "backlog",
  "todo",
  "in_progress",
  "done",
  "cancelled",
];

function IssueCard({ issue }: { issue: Issue }) {
  return (
    <Card className="cursor-grab active:cursor-grabbing">
      <CardContent className="flex flex-col gap-2 p-3">
        <div className="flex items-center gap-2">
          <IssuePriorityIcon priority={issue.priority as Priority} />
          <Link
            to={`/issues/${issue.id}`}
            className="flex-1 text-sm font-medium hover:underline"
          >
            {issue.title}
          </Link>
          <CopyPromptButton issue={issue} />
        </div>
        <div className="flex items-center gap-2">
          {issue.issueLabels?.map((il) => (
            <LabelBadge
              key={il.label.id}
              name={il.label.name}
              color={il.label.color}
            />
          ))}
        </div>
        {issue.assignee && (
          <div className="flex items-center gap-1.5">
            <UserAvatar
              name={issue.assignee.user.name}
              image={issue.assignee.user.image}
              className="size-5"
            />
            <span className="text-xs text-muted-foreground">
              {issue.assignee.user.name}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SortableIssueCard({ issue }: { issue: Issue }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: issue.id, data: { status: issue.status } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <IssueCard issue={issue} />
    </div>
  );
}

function DroppableColumn({
  status,
  count,
  children,
}: {
  status: IssueStatus;
  count: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const config = statusConfig[status];

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-lg p-2 transition-colors ${isOver ? "bg-muted" : "bg-muted/50"}`}
    >
      <div className="mb-2 flex items-center gap-2 px-1">
        <IssueStatusIcon status={status} />
        <span className="text-sm font-medium">{config.label}</span>
        <span className="text-xs text-muted-foreground">{count}</span>
      </div>
      {children}
    </div>
  );
}

function buildColumns(issues: Array<Issue>): Record<string, Array<Issue>> {
  const map: Record<string, Array<Issue>> = {};
  for (const col of COLUMNS) map[col] = [];
  for (const issue of issues) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    map[issue.status]?.push(issue);
  }
  return map;
}

function findColumnOfItem(
  columns: Record<string, Array<Issue>>,
  itemId: string,
): string | null {
  for (const [status, items] of Object.entries(columns)) {
    if (items.some((i) => i.id === itemId)) return status;
  }
  return null;
}

export function IssueKanban({ issues }: { issues: Array<Issue> }) {
  const queryClient = useQueryClient();
  const [activeIssue, setActiveIssue] = React.useState<Issue | null>(null);
  const [columns, setColumns] = React.useState(() => buildColumns(issues));
  const isDraggingOrMutating = React.useRef(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  // Sync local state when server data changes, but never during drag or pending mutation
  React.useEffect(() => {
    if (!isDraggingOrMutating.current) {
      setColumns(buildColumns(issues));
    }
  }, [issues]);

  const reorderMutation = useMutation({
    mutationFn: reorderIssue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
    },
    onSettled: () => {
      isDraggingOrMutating.current = false;
    },
    onError: () => {
      setColumns(buildColumns(issues));
    },
  });

  function handleDragStart(event: DragStartEvent) {
    isDraggingOrMutating.current = true;
    const issue = issues.find((i) => i.id === event.active.id);
    if (issue) setActiveIssue(issue);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeColumn = findColumnOfItem(columns, activeId);
    if (!activeColumn) return;

    // Determine over column
    let overColumn: string | null;
    if (COLUMNS.includes(overId as IssueStatus)) {
      overColumn = overId;
    } else {
      overColumn = findColumnOfItem(columns, overId);
    }
    if (!overColumn || activeColumn === overColumn) return;

    // Move item to new column optimistically
    setColumns((prev) => {
      const sourceItems = [...prev[activeColumn]];
      const destItems = [...prev[overColumn]];

      const activeIndex = sourceItems.findIndex((i) => i.id === activeId);
      if (activeIndex === -1) return prev;

      const [movedItem] = sourceItems.splice(activeIndex, 1);
      const updatedItem = { ...movedItem, status: overColumn };

      // Find insertion index
      const overIndex = destItems.findIndex((i) => i.id === overId);
      if (overIndex >= 0) {
        destItems.splice(overIndex, 0, updatedItem);
      } else {
        destItems.push(updatedItem);
      }

      return { ...prev, [activeColumn]: sourceItems, [overColumn]: destItems };
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveIssue(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeColumn = findColumnOfItem(columns, activeId);
    if (!activeColumn) return;

    // Reorder within same column
    const overColumn = COLUMNS.includes(overId as IssueStatus)
      ? overId
      : findColumnOfItem(columns, overId);
    if (!overColumn) return;

    if (activeColumn === overColumn) {
      const items = columns[activeColumn];
      const oldIndex = items.findIndex((i) => i.id === activeId);
      const newIndex = items.findIndex((i) => i.id === overId);

      if (oldIndex !== newIndex && newIndex >= 0) {
        const reordered = arrayMove(items, oldIndex, newIndex);
        setColumns((prev) => ({ ...prev, [activeColumn]: reordered }));
      }
    }

    // Find final position and send to server
    const finalColumn = findColumnOfItem(columns, activeId);
    if (!finalColumn) return;
    const finalItems = columns[finalColumn];
    const finalIndex = finalItems.findIndex((i) => i.id === activeId);

    reorderMutation.mutate({
      id: activeId,
      sortOrder: finalIndex >= 0 ? finalIndex : 0,
      status: finalColumn,
    });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="min-w-0 overflow-x-auto">
        <div
          className="flex gap-4 pb-4"
          style={{
            minWidth: `${COLUMNS.length * 288 + (COLUMNS.length - 1) * 16}px`,
          }}
        >
          {COLUMNS.map((status) => {
            const columnIssues = columns[status] ?? [];
            return (
              <DroppableColumn
                key={status}
                status={status}
                count={columnIssues.length}
              >
                <SortableContext
                  id={status}
                  items={columnIssues.map((i) => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex min-h-[40px] flex-col gap-2">
                    {columnIssues.map((issue) => (
                      <SortableIssueCard key={issue.id} issue={issue} />
                    ))}
                  </div>
                </SortableContext>
              </DroppableColumn>
            );
          })}
        </div>
      </div>
      <DragOverlay>
        {activeIssue ? <IssueCard issue={activeIssue} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
