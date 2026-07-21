import { PageHeader } from "@/components/ui/PageHeader";
import { RegisterForm } from "@/components/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="container-content">
      <div className="mx-auto max-w-lg">
        <PageHeader
          title="Register your business"
          description="BizWatch 4551 is a private service. Register your business to apply for access. Only approved businesses can sign in and use reporting features."
        />
        <RegisterForm />
      </div>
    </div>
  );
}
