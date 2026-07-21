export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8" aria-labelledby={`section-${title.replace(/\s+/g, "-").toLowerCase()}`}>
      <h2
        id={`section-${title.replace(/\s+/g, "-").toLowerCase()}`}
        className="card-heading mb-1"
      >
        {title}
      </h2>
      {description ? <p className="supporting-text mb-4">{description}</p> : null}
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function FormField({
  label,
  htmlFor,
  required,
  optional,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="form-label">
        {label}
        {required ? (
          <span className="text-coral-600" aria-hidden="true">
            {" "}
            *
          </span>
        ) : null}
        {optional ? <span className="form-optional"> (optional)</span> : null}
      </label>
      {children}
      {hint && !error ? <p className="form-hint">{hint}</p> : null}
      {error ? (
        <p className="form-error" id={`${htmlFor}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
