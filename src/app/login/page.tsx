import { redirect } from "next/navigation";

/** Customer login disabled — OTP UI preserved in CustomerLoginForm.disabled.tsx */
export default function LoginPage() {
  redirect("/book");
}
