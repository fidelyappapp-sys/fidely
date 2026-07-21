import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="mb-8 text-lg font-semibold tracking-tight">Fidély</div>
      <div className="w-full max-w-sm">
        <AdminLoginForm />
      </div>
    </div>
  );
}
