import { REPORT_STEPS } from "@/lib/types";

export function ProgressStepper({ currentStep }: { currentStep: number }) {
  return (
    <nav aria-label="Report progress" className="mb-8">
      <ol className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-4 sm:gap-y-2">
        {REPORT_STEPS.map((label, index) => {
          const stepNum = index + 1;
          const isComplete = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;

          return (
            <li
              key={label}
              className={`flex items-center gap-2 text-sm ${
                isCurrent
                  ? "font-semibold text-navy-900"
                  : isComplete
                    ? "text-teal-700"
                    : "text-grey-500"
              }`}
              aria-current={isCurrent ? "step" : undefined}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  isCurrent
                    ? "bg-navy-900 text-white"
                    : isComplete
                      ? "bg-teal-100 text-teal-700"
                      : "bg-grey-100 text-grey-500"
                }`}
                aria-hidden="true"
              >
                {isComplete ? "✓" : stepNum}
              </span>
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{isCurrent ? label : null}</span>
            </li>
          );
        })}
      </ol>
      <p className="small-text mt-2 sm:hidden">
        Step {currentStep} of {REPORT_STEPS.length}: {REPORT_STEPS[currentStep - 1]}
      </p>
    </nav>
  );
}
