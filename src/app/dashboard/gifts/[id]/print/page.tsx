import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import GiftQRPrint from "@/components/admin/GiftQRPrint";

export default async function GiftPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ autoprint?: string }>;
}) {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }

  const { id } = await params;
  const { autoprint } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: gift } = await supabase
    .from("gifts")
    .select("title, slug")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!gift) {
    redirect("/dashboard");
  }

  return (
    <GiftQRPrint
      title={gift.title}
      slug={gift.slug}
      autoPrint={autoprint === "1"}
    />
  );
}
