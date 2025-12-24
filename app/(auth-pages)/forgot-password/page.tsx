import { redirect } from "next/navigation";

export default async function ForgotPassword() {
  redirect("/sign-in");
}
