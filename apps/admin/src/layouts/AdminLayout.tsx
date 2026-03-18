import { Outlet } from "react-router-dom";
import {
  SidebarInset,
  SidebarProvider,
} from "@workspace/ui/components/sidebar";
import { AdminSidebar } from "@/components/admin-sidebar";

export function AdminLayout() {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <div className="flex flex-1 flex-col p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
