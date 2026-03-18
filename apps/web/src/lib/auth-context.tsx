import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { authClient } from "./auth-client";
import type { ReactNode } from "react";
import type { Organization } from "./types";

type User = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
};

type AuthContextValue = {
  user: User | null;
  organizations: Array<Organization>;
  activeOrganization: Organization | null;
  loading: boolean;
  refetch: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organizations, setOrganizations] = useState<Array<Organization>>([]);
  const [activeOrganization, setActiveOrganization] =
    useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const { data: session } = await authClient.getSession();
      if (session) {
        setUser(session.user as User);

        const activeOrg =
          (session as { activeOrganization?: Organization })
            .activeOrganization ?? null;

        const { data: orgs } = await authClient.organization.list();
        const orgList = orgs ?? [];
        setOrganizations(orgList);

        // Auto-activate the first organization if none is active
        if (!activeOrg && orgList.length > 0) {
          await authClient.organization.setActive({
            organizationId: orgList[0].id,
          });
          setActiveOrganization(orgList[0] as Organization);
        } else {
          setActiveOrganization(activeOrg);
        }
      } else {
        setUser(null);
        setOrganizations([]);
        setActiveOrganization(null);
      }
    } catch {
      setUser(null);
      setOrganizations([]);
      setActiveOrganization(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <AuthContext.Provider
      value={{ user, organizations, activeOrganization, loading, refetch }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function ProtectedRoute() {
  const { user, organizations, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate to="/sign-in" state={{ redirect: location.pathname }} replace />
    );
  }

  if (organizations.length === 0 && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
