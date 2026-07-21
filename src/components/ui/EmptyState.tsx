export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card text-center py-10">
      <p className="card-heading">{title}</p>
      <p className="supporting-text mt-2 max-w-md mx-auto">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
