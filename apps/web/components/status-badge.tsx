export function StatusBadge({ status }: { status: string | null | undefined }) {
  const normalized = status?.toUpperCase() ?? "PENDING";
  const className =
    normalized === "FAIL" || normalized === "CRITICAL"
      ? "badge badge-fail"
      : normalized === "WARN" || normalized === "WARNING" || normalized === "PROCESSING"
        ? "badge badge-warn"
        : "badge badge-pass";
  return <span className={className}>{normalized}</span>;
}

