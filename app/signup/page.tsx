import SignupForm from "@/components/signup-form";

export default function SignupPage() {
  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="mb-2 text-3xl font-bold">Join Cube Arena</h1>
      <p className="mb-8 text-gray-500">
        Create your account and get ready to compete.
      </p>

      <SignupForm />
    </main>
  );
}
