import { Routes, Route } from "react-router-dom"
import { ProtectedRoute } from "@/lib/auth-context"
import { AuthedLayout } from "@/layouts/AuthedLayout"
import { ProjectLayout } from "@/layouts/ProjectLayout"
import { SignInPage } from "@/pages/SignInPage"
import { SignUpPage } from "@/pages/SignUpPage"
import { DashboardPage } from "@/pages/DashboardPage"
import { OnboardingPage } from "@/pages/OnboardingPage"
import { ProjectsPage } from "@/pages/ProjectsPage"
import { ProjectIssuesPage } from "@/pages/ProjectIssuesPage"
import { ProjectSettingsPage } from "@/pages/ProjectSettingsPage"
import { IssueDetailPage } from "@/pages/IssueDetailPage"
import { ClientsPage } from "@/pages/ClientsPage"
import { ClientDetailPage } from "@/pages/ClientDetailPage"
import { LabelsPage } from "@/pages/LabelsPage"

export function App() {
  return (
    <Routes>
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/sign-up" element={<SignUpPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/onboarding" element={<OnboardingPage />} />

        <Route element={<AuthedLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:projectId" element={<ProjectLayout />}>
            <Route index element={<ProjectIssuesPage />} />
            <Route path="settings" element={<ProjectSettingsPage />} />
          </Route>
          <Route path="/issues/:issueId" element={<IssueDetailPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/clients/:clientId" element={<ClientDetailPage />} />
          <Route path="/labels" element={<LabelsPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
