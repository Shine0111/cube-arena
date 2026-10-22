import Link from "next/link";
import ForgotPasswordForm from "@/components/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="mb-2 text-3xl font-bold">Reset your password</h1>

      <p className="mb-8 text-gray-500">
        Enter the email associated with your account and we'll send you a
        recovery link.
      </p>

      <ForgotPasswordForm />

      <p className="mt-6 text-sm">
        Remembered your password?{" "}
        <Link className="underline" href="/login">
          Sign in
        </Link>
      </p>
    </main>
  );
}
