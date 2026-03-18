import { Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/lib/auth-context";
import { AdminLayout } from "@/layouts/AdminLayout";
import { SignInPage } from "@/pages/SignInPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { UsersPage } from "@/pages/UsersPage";
import { OrganizationsPage } from "@/pages/OrganizationsPage";
import { BackupsPage } from "@/pages/BackupsPage";

export function App() {
  return (
    <Routes>
      <Route path="/sign-in" element={<SignInPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/organizations" element={<OrganizationsPage />} />
          <Route path="/backups" element={<BackupsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
