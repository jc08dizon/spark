import Image from "next/image";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-secondary p-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <Image
            src="/ciit-logo.png"
            alt="CIIT"
            width={160}
            height={40}
            style={{ width: "160px", height: "auto" }}
            priority
          />
          <p className="text-sm text-muted-foreground">
            Sign in to S.P.A.R.K.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
