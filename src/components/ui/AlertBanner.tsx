type Variant = "info" | "warning" | "success" | "error";

const styles: Record<Variant, string> = {
  info: "border-l-4 border-navy-800 bg-blue-100 text-grey-950",
  warning: "border-l-4 border-amber-700 bg-amber-100 text-grey-950",
  success: "border-l-4 border-green-700 bg-green-100 text-grey-950",
  error: "border-l-4 border-coral-600 bg-coral-100 text-grey-950",
};

export function AlertBanner({
  variant = "info",
  title,
  children,
  role = "status",
}: {
  variant?: Variant;
  title?: string;
  children: React.ReactNode;
  role?: "status" | "alert";
}) {
  return (
    <div className={`rounded-md p-4 ${styles[variant]}`} role={role}>
      {title ? <p className="mb-1 font-semibold">{title}</p> : null}
      <div className="text-[15px] leading-relaxed">{children}</div>
    </div>
  );
}
