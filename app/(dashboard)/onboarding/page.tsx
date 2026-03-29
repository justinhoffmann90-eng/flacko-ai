import { Header } from "@/components/dashboard/header";
import dynamicImport from "next/dynamic";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const OnboardingContent = dynamicImport(
  () =>
    import("@/components/dashboard/onboarding-content").then((mod) => ({
      default: mod.OnboardingContent,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="max-w-3xl mx-auto space-y-6 px-4 py-8">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-6 w-48 bg-zinc-700/50 rounded mb-4" />
            <div className="space-y-2">
              <div className="h-4 bg-zinc-800/40 rounded" />
              <div className="h-4 bg-zinc-800/40 rounded w-3/4" />
            </div>
          </Card>
        ))}
      </div>
    ),
  }
);

export default function OnboardingPage() {
  return (
    <>
      <Header title="Welcome to Flacko AI" />
      <main className="px-4 py-6 md:px-0">
        <OnboardingContent />
      </main>
    </>
  );
}
