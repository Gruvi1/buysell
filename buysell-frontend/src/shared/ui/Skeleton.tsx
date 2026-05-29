import { cn } from "../lib/utils";

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl bg-gradient-to-r from-zinc-100 via-white to-zinc-100",
        className
      )}
    />
  );
}
