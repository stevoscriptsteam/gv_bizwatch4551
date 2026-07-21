import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoginForm } from "@/components/LoginForm";
import { EmergencyNotice } from "@/components/ui/EmergencyNotice";

export default function SignInPage() {
  return (
    <div className="container-content">
      <div className="mx-auto max-w-lg">
        <PageHeader
          title="Sign in"
          description="Approved businesses in postcode 4551 can sign in with their registered mobile number."
        />
        <EmergencyNotice />
        <div className="card card-shadow mt-6">
          <Suspense fallback={<p className="supporting-text">Loading…</p>}>
            <LoginForm />
          </Suspense>
        </div>
        <p className="small-text mt-4">
          Not registered yet?{" "}
          <Link href="/register" className="font-semibold text-navy-800 hover:underline">
            Register your business
          </Link>{" "}
          to apply for access. Approval is required before you can sign in.
        </p>
      </div>
    </div>
  );
}
