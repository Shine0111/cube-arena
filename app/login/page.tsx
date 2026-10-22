import LoginForm from "@/components/login-form";
import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="mb-2 text-3xl font-bold">Welcome back</h1>

      <p className="mb-8 text-gray-500">
        Sign in to continue your Cube Arena journey.
      </p>

      <LoginForm />
      <p className="mt-4 text-right text-sm">
        <Link href="/forgot-password" className="underline">
          Forgot your password?
        </Link>
      </p>
    </main>
  );
}
