import { redirect } from "next/navigation";

export default async function AdminEditGiftRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/gifts/${id}/edit`);
}
