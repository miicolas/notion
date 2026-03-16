import { useState, useCallback, useEffect } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import type { WidgetConfig } from "@/lib/types";
import {
  DEFAULT_WIDGETS,
  WIDGET_REGISTRY,
} from "@/components/dashboard/widget-registry";

const STORAGE_KEY = "dashboard-widgets";

function loadWidgets(): WidgetConfig[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as WidgetConfig[];
      // Filter out widgets that no longer exist in registry
      return parsed.filter((w) => w.type in WIDGET_REGISTRY);
    }
  } catch {
    // ignore
  }
  return DEFAULT_WIDGETS;
}

export function useDashboardConfig() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(loadWidgets);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
  }, [widgets]);

  const addWidget = useCallback((type: string) => {
    const def = WIDGET_REGISTRY[type];
    if (!def) return;
    setWidgets((prev) => [
      ...prev,
      { id: crypto.randomUUID(), type, size: def.defaultSize },
    ]);
  }, []);

  const removeWidget = useCallback((id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const reorderWidgets = useCallback((oldIndex: number, newIndex: number) => {
    setWidgets((prev) => arrayMove(prev, oldIndex, newIndex));
  }, []);

  return { widgets, addWidget, removeWidget, reorderWidgets };
}
