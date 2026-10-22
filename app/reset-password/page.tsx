import Link from "next/link";
import ResetPasswordForm from "@/components/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="mb-2 text-3xl font-bold">Choose a new password</h1>

      <p className="mb-8 text-gray-500">
        Choose a strong password you haven't used elsewhere.
      </p>

      <ResetPasswordForm />

      <p className="mt-6 text-sm">
        Back to{" "}
        <Link className="underline" href="/login">
          sign in
        </Link>
      </p>
    </main>
  );
}
