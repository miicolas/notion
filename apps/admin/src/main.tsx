import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@workspace/ui/components/tooltip";
import { AdminAuthProvider } from "@/lib/auth-context";
import { App } from "@/App";
import "@workspace/ui/globals.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AdminAuthProvider>
          <TooltipProvider>
            <App />
          </TooltipProvider>
        </AdminAuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
);
