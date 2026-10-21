import LoginForm from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="mb-2 text-3xl font-bold">Welcome back</h1>

      <p className="mb-8 text-gray-500">
        Sign in to continue your Cube Arena journey.
      </p>

      <LoginForm />
    </main>
  );
}
