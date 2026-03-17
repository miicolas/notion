import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/lib/auth-context";
import { AuthedLayout } from "@/layouts/AuthedLayout";
import { ProjectLayout } from "@/layouts/ProjectLayout";
import { SettingsLayout } from "@/layouts/SettingsLayout";
import { SignInPage } from "@/pages/SignInPage";
import { SignUpPage } from "@/pages/SignUpPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { OnboardingPage } from "@/pages/OnboardingPage";
import { ProjectsPage } from "@/pages/ProjectsPage";
import { ProjectIssuesPage } from "@/pages/ProjectIssuesPage";
import { ProjectSettingsPage } from "@/pages/ProjectSettingsPage";
import { IssueDetailPage } from "@/pages/IssueDetailPage";
import { ClientsPage } from "@/pages/ClientsPage";
import { ClientDetailPage } from "@/pages/ClientDetailPage";
import { LabelsPage } from "@/pages/LabelsPage";
import { TeamsPage } from "@/pages/TeamsPage";
import { TeamDetailPage } from "@/pages/TeamDetailPage";
import { SettingsOrganizationPage } from "@/pages/settings/SettingsOrganizationPage";
import { SettingsMembersPage } from "@/pages/settings/SettingsMembersPage";
import { SettingsTeamsPage } from "@/pages/settings/SettingsTeamsPage";
import { SprintsPage } from "@/pages/SprintsPage";
import { SprintPlanningPage } from "@/pages/SprintPlanningPage";
import { InvitationAcceptPage } from "@/pages/settings/InvitationAcceptPage";

export function App() {
  return (
    <Routes>
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/sign-up" element={<SignUpPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route
          path="/invitations/accept"
          element={<InvitationAcceptPage />}
        />

        <Route element={<AuthedLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:projectId" element={<ProjectLayout />}>
            <Route index element={<ProjectIssuesPage />} />
            <Route path="sprints" element={<SprintsPage />} />
            <Route path="settings" element={<ProjectSettingsPage />} />
            <Route
              path="sprint-planning/:sprintId"
              element={<SprintPlanningPage />}
            />
          </Route>
          <Route path="/issues/:issueId" element={<IssueDetailPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/clients/:clientId" element={<ClientDetailPage />} />
          <Route path="/labels" element={<LabelsPage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/teams/:teamId" element={<TeamDetailPage />} />

          <Route path="/settings" element={<SettingsLayout />}>
            <Route
              index
              element={<Navigate to="/settings/organization" replace />}
            />
            <Route
              path="organization"
              element={<SettingsOrganizationPage />}
            />
            <Route path="members" element={<SettingsMembersPage />} />
            <Route path="teams" element={<SettingsTeamsPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
