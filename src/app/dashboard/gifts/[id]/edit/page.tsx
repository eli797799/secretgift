import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import EditGiftClient from "@/components/admin/EditGiftClient";

export default async function EditGiftPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }

  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: gift } = await supabase
    .from("gifts")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!gift) {
    redirect("/dashboard");
  }

  return <EditGiftClient gift={gift} />;
}
