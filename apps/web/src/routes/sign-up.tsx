import { createFileRoute, redirect } from "@tanstack/react-router"
import { SignupForm } from "@/components/signup-form"
import { getSession } from "@/lib/session"

export const Route = createFileRoute("/sign-up")({
  beforeLoad: async () => {
    const session = await getSession()
    if (session) {
      throw redirect({ to: "/" })
    }
  },
  component: SignUpPage,
})

function SignUpPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <SignupForm />
      </div>
    </div>
  )
}
