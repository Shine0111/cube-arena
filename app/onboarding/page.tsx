import OnboardingForm from "@/components/onboarding-form";

export default function OnboardingPage() {
  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="mb-2 text-3xl font-bold">Set up your player profile</h1>

      <p className="mb-8 text-gray-500">
        Choose the username other cubers will see.
      </p>

      <OnboardingForm />
    </main>
  );
}
