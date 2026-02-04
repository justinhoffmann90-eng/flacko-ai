import { Skeleton } from "@/components/ui/skeleton";

export default function TopicLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="mt-2 h-10 w-64" />
        <Skeleton className="mt-4 h-6 w-full max-w-md" />
        <div className="mt-8 space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </div>
  );
}
