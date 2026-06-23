import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string) || "general";

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const isImage = file.type.startsWith("image/");
  const isAudio = file.type.startsWith("audio/");

  if (!isImage && !isAudio) {
    return NextResponse.json({ error: "Only image and audio files are allowed" }, { status: 400 });
  }

  const maxSize = isAudio ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: isAudio ? "Audio file too large (max 10MB)" : "Image file too large (max 5MB)" },
      { status: 400 }
    );
  }

  const ext = file.name.split(".").pop();
  const fileName = `${user.id}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from("gift-images")
    .upload(fileName, file, { contentType: file.type, upsert: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from("gift-images").getPublicUrl(fileName);

  return NextResponse.json({ url: urlData.publicUrl });
}
