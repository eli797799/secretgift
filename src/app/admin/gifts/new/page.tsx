import { redirect } from "next/navigation";

export default function AdminNewGiftRedirect() {
  redirect("/dashboard/gifts/new");
}
