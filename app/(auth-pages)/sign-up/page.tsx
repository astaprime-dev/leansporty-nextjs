import { redirect } from "next/navigation";

export default async function Signup() {
  redirect("/sign-in");
}
