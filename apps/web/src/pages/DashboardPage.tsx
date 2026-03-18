import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { AlertTriangle, CheckCircle2, Clock, FolderKanban } from "lucide-react";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { useAuth } from "@/lib/auth-context";
import { getProjects } from "@/lib/projects";
import { getIssues } from "@/lib/issues";
import { getDashboardStats } from "@/lib/dashboard";
import { useDashboardConfig } from "@/hooks/use-dashboard-config";
import { PageHeader } from "@/components/page-header";
import { DashboardWidgetCard } from "@/components/dashboard/dashboard-widget-card";
import { AddWidgetDialog } from "@/components/dashboard/add-widget-dialog";

export function DashboardPage() {
  const { activeOrganization } = useAuth();
  const { widgets, addWidget, removeWidget, reorderWidgets } =
    useDashboardConfig();

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
    enabled: !!activeOrganization,
  });
  const { data: issues = [] } = useQuery({
    queryKey: ["issues"],
    queryFn: () => getIssues(),
    enabled: !!activeOrganization,
  });
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
    enabled: !!activeOrganization,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const activeProjects = projects.filter((p) => p.status === "active");
  const todoCount = issues.filter(
    (i) => i.status === "todo" || i.status === "in_progress",
  ).length;
  const doneCount = issues.filter((i) => i.status === "done").length;
  const urgentCount = issues.filter(
    (i) => i.priority === "urgent" || i.priority === "high",
  ).length;

  const [activeWidgetId, setActiveWidgetId] = useState<string | null>(null);
  const activeWidget = activeWidgetId
    ? widgets.find((w) => w.id === activeWidgetId)
    : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveWidgetId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveWidgetId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = widgets.findIndex((w) => w.id === active.id);
    const newIndex = widgets.findIndex((w) => w.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      reorderWidgets(oldIndex, newIndex);
    }
  }

  return (
    <>
      <PageHeader title="Dashboard">
        <AddWidgetDialog
          widgets={widgets}
          onAdd={addWidget}
          onRemove={removeWidget}
        />
      </PageHeader>

      <div className="flex flex-1 flex-col gap-4 p-4">
        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Active Projects
              </CardTitle>
              <FolderKanban className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeProjects.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todoCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{doneCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Urgent/High</CardTitle>
              <AlertTriangle className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{urgentCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Widgets Grid */}
        {stats && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={widgets.map((w) => w.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {widgets.map((widget) => (
                  <DashboardWidgetCard
                    key={widget.id}
                    config={widget}
                    stats={stats}
                    onRemove={removeWidget}
                  />
                ))}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeWidget && stats ? ( // eslint-disable-line @typescript-eslint/no-unnecessary-condition
                <div className="w-[300px]">
                  <DashboardWidgetCard
                    config={activeWidget}
                    stats={stats}
                    onRemove={() => {}}
                    isDragOverlay
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </>
  );
}
