export default function DashboardLoading() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          className="h-36 animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface)]"
          key={index}
        />
      ))}
    </div>
  );
}
