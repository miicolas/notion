import { useSearchParams } from "react-router-dom";
import { LoginForm } from "@/components/login-form";

export function SignInPage() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? undefined;

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <LoginForm redirectTo={redirectTo} />
      </div>
    </div>
  );
}
