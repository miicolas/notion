import { Calendar } from "@workspace/ui/components/calendar";
import {
  SidebarGroup,
  SidebarGroupContent,
} from "@workspace/ui/components/sidebar";

export function DatePicker({
  selectedDate,
  onSelectDate,
  taskDates,
}: {
  selectedDate?: Date;
  onSelectDate?: (date: Date | undefined) => void;
  taskDates?: Array<Date>;
}) {
  return (
    <SidebarGroup className="px-0">
      <SidebarGroupContent>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onSelectDate}
          modifiers={{ hasTask: taskDates ?? [] }}
          modifiersClassNames={{
            hasTask:
              "relative after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:size-1 after:rounded-full after:bg-primary",
          }}
          className="[&_[role=gridcell].bg-accent]:bg-sidebar-primary [&_[role=gridcell].bg-accent]:text-sidebar-primary-foreground [&_[role=gridcell]]:w-[33px]"
        />
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
