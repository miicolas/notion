import {
  
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { authClient } from "./auth-client";
import type {ReactNode} from "react";

type User = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role?: string | null;
};

type AdminAuthContextValue = {
  user: User | null;
  loading: boolean;
  refetch: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const { data: session } = await authClient.getSession();
      if (session) {
        const u = session.user as User;
        if (u.role === "admin") {
          setUser(u);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <AdminAuthContext.Provider value={{ user, loading, refetch }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx)
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}

export function ProtectedRoute() {
  const { user, loading } = useAdminAuth();
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

  return <Outlet />;
}
