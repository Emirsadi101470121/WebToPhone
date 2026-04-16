import { cn } from "@/lib/utils";

interface Props {
  className?: string;
}

export function Skeleton({ className }: Props) {
  return <div className={cn("animate-pulse rounded-lg bg-muted", className)} />;
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-white/5 bg-card p-5">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    </div>
  );
}

export function ProjectSkeleton() {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/5 bg-card p-5">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-4 w-4" />
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center pt-16">
      <div className="space-y-4 text-center">
        <Skeleton className="mx-auto h-10 w-10 rounded-xl" />
        <Skeleton className="mx-auto h-4 w-32" />
        <Skeleton className="mx-auto h-3 w-48" />
      </div>
    </div>
  );
}
