import { redirect } from "next/navigation";

/** Customer sign-up disabled — was same OTP flow as /login */
export default function RegisterPage() {
  redirect("/book");
}
