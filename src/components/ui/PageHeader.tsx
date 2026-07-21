export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-8 border-b border-grey-200 pb-6">
      <h1 className="page-title">{title}</h1>
      {description ? <p className="supporting-text mt-3 max-w-3xl">{description}</p> : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </header>
  );
}
