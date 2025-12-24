import { redirect } from "next/navigation";

export default async function ResetPassword() {
  redirect("/sign-in");
}
