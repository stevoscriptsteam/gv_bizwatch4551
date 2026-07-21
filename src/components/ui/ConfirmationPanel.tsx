export function ConfirmationPanel({
  reference,
  title = "Report submitted",
  children,
}: {
  reference: string;
  title?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="card card-shadow max-w-xl" role="status" aria-live="polite">
      <p className="category-label text-teal-700">Confirmation</p>
      <h2 className="section-heading mt-2">{title}</h2>
      <p className="supporting-text mt-3">
        Your reference number is{" "}
        <strong className="font-mono text-navy-900">{reference}</strong>. Please
        keep this for your records.
      </p>
      {children ? <div className="mt-4 space-y-3">{children}</div> : null}
      <div className="mt-6 rounded-md bg-blue-100 p-4">
        <p className="text-sm font-semibold text-grey-950">What happens next</p>
        <ul className="small-text mt-2 list-disc pl-5 space-y-1">
          <li>Your report is recorded in the BizWatch system.</li>
          <li>Relevant local alerts may be shared with registered businesses in the 4551 area.</li>
          <li>You may be contacted if further information is needed.</li>
          <li>BizWatch does not replace police reporting. Contact police directly if required.</li>
        </ul>
      </div>
    </div>
  );
}
