import { Link, Outlet, useLocation } from "react-router-dom";
import { cn } from "@workspace/ui/lib/utils";
import { PageHeader } from "@/components/page-header";

const tabs = [
  { label: "Organization", href: "/settings/organization" },
  { label: "Members", href: "/settings/members" },
  { label: "Teams", href: "/settings/teams" },
];

export function SettingsLayout() {
  const { pathname } = useLocation();

  return (
    <>
      <PageHeader title="Settings" />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <nav className="flex gap-4 border-b">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              to={tab.href}
              className={cn(
                "border-b-2 px-1 pb-2 text-sm font-medium transition-colors",
                pathname === tab.href
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
        <Outlet />
      </div>
    </>
  );
}
