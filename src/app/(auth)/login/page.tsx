import { AuthForm } from "@/features/auth/components/auth-form";

export const metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="absolute inset-0 bg-grid opacity-60" />
      <div className="absolute left-1/2 top-1/3 size-[40rem] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
      <div className="relative z-10">
        <AuthForm />
      </div>
    </div>
  );
}
