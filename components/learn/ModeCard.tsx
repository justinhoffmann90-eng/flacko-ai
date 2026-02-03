interface ModeCardProps {
  label: string;
  cap: string;
  description: string;
  color: string;
}

export function ModeCard({ label, cap, description, color }: ModeCardProps) {
  return (
    <div
      className="rounded-xl border p-4 sm:p-5 bg-background/60"
      style={{ borderColor: color }}
    >
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
        <h3 className="text-base sm:text-lg font-semibold" style={{ color }}>
          {label}
        </h3>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">Daily cap: {cap}</p>
      <p className="mt-3 text-sm text-foreground/80">{description}</p>
    </div>
  );
}
