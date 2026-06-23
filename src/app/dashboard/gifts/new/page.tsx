import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import CreateGiftClient from "@/components/admin/CreateGiftClient";

export default async function NewGiftPage() {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }

  return <CreateGiftClient />;
}
