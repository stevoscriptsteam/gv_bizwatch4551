import { PageHeader } from "@/components/ui/PageHeader";

export default function AccessibilityPage() {
  return (
    <div className="container-content container-reading">
      <PageHeader
        title="Accessibility"
        description="Our commitment to accessible design."
      />
      <div className="space-y-4 supporting-text">
        <p>
          BizWatch aims to meet WCAG 2.2 Level AA. We use semantic HTML, visible focus
          states, sufficient colour contrast and descriptive labels on all form fields.
        </p>
        <p>
          If you experience difficulty using BizWatch, please contact us with details
          of the issue and we will work to resolve it.
        </p>
      </div>
    </div>
  );
}
