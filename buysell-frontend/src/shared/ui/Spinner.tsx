type SpinnerProps = {
  label?: string;
};

export function Spinner({ label = "Загрузка" }: SpinnerProps) {
  return (
    <div className="inline-flex items-center gap-3 text-sm text-muted">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-accent" />
      <span>{label}</span>
    </div>
  );
}
