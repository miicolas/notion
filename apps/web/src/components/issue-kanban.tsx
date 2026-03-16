import * as React from "react"
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useRouter } from "@tanstack/react-router"
import { reorderIssue } from "@/lib/issues"
import { IssueStatusIcon, statusConfig, type IssueStatus } from "./issue-status-icon"
import { IssuePriorityIcon, type Priority } from "./issue-priority-icon"
import { LabelBadge } from "./label-badge"
import { UserAvatar } from "./user-avatar"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Link } from "@tanstack/react-router"
import type { Issue } from "@/lib/types"

const COLUMNS: IssueStatus[] = ["backlog", "todo", "in_progress", "done", "cancelled"]

function IssueCard({ issue }: { issue: Issue }) {
  return (
    <Card className="cursor-grab active:cursor-grabbing">
      <CardContent className="flex flex-col gap-2 p-3">
        <div className="flex items-center gap-2">
          <IssuePriorityIcon priority={issue.priority as Priority} />
          <Link
            to="/issues/$issueId"
            params={{ issueId: issue.id }}
            className="text-sm font-medium hover:underline"
          >
            {issue.title}
          </Link>
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
            <UserAvatar name={issue.assignee.user.name} image={issue.assignee.user.image} className="size-5" />
            <span className="text-xs text-muted-foreground">
              {issue.assignee.user.name}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function SortableIssueCard({ issue }: { issue: Issue }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: issue.id, data: { status: issue.status } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <IssueCard issue={issue} />
    </div>
  )
}

export function IssueKanban({ issues }: { issues: Issue[] }) {
  const router = useRouter()
  const [activeIssue, setActiveIssue] = React.useState<Issue | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const issuesByStatus = React.useMemo(() => {
    const map: Record<string, Issue[]> = {}
    for (const col of COLUMNS) map[col] = []
    for (const issue of issues) {
      if (map[issue.status]) map[issue.status].push(issue)
    }
    return map
  }, [issues])

  function handleDragStart(event: DragStartEvent) {
    const issue = issues.find((i) => i.id === event.active.id)
    if (issue) setActiveIssue(issue)
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveIssue(null)
    const { active, over } = event
    if (!over) return

    const issueId = active.id as string
    // Determine target column: if dropped over a column container, use its id; otherwise use the issue's status
    let targetStatus: string
    if (COLUMNS.includes(over.id as IssueStatus)) {
      targetStatus = over.id as string
    } else {
      const overIssue = issues.find((i) => i.id === over.id)
      targetStatus = overIssue?.status ?? active.data.current?.status ?? "backlog"
    }

    const columnIssues = issuesByStatus[targetStatus] ?? []
    const overIndex = columnIssues.findIndex((i) => i.id === over.id)
    const newSortOrder = overIndex >= 0 ? overIndex : columnIssues.length

    await reorderIssue({
      data: { id: issueId, sortOrder: newSortOrder, status: targetStatus },
    })
    router.invalidate()
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((status) => {
          const columnIssues = issuesByStatus[status] ?? []
          const config = statusConfig[status]
          return (
            <div
              key={status}
              className="flex w-72 shrink-0 flex-col rounded-lg bg-muted/50 p-2"
            >
              <div className="mb-2 flex items-center gap-2 px-1">
                <IssueStatusIcon status={status} />
                <span className="text-sm font-medium">{config.label}</span>
                <span className="text-xs text-muted-foreground">
                  {columnIssues.length}
                </span>
              </div>
              <SortableContext
                id={status}
                items={columnIssues.map((i) => i.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-2">
                  {columnIssues.map((issue) => (
                    <SortableIssueCard key={issue.id} issue={issue} />
                  ))}
                </div>
              </SortableContext>
            </div>
          )
        })}
      </div>
      <DragOverlay>
        {activeIssue ? <IssueCard issue={activeIssue} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
