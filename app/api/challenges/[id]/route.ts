import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function storagePath(imageUrl: string | null) {
  if (!imageUrl) return null;
  const marker = "/storage/v1/object/public/challenge-images/";
  const index = imageUrl.indexOf(marker);
  return index === -1 ? null : decodeURIComponent(imageUrl.slice(index + marker.length));
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const admin = getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Server auth is unavailable" }, { status: 503 });
  }

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const {
    data: { user },
    error: userError,
  } = await admin.auth.getUser(token);
  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: rawId } = await context.params;
  const id = Number(rawId);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid challenge" }, { status: 400 });
  }

  const { data: challenge, error: challengeError } = await admin
    .from("challenges")
    .select("id, author_id, image_url")
    .eq("id", id)
    .maybeSingle();
  if (challengeError) {
    return NextResponse.json({ error: challengeError.message }, { status: 500 });
  }
  if (!challenge) return NextResponse.json({ ok: true });
  if (challenge.author_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error: attemptError } = await admin
    .from("attempts")
    .delete()
    .eq("challenge_id", id);
  if (attemptError) {
    return NextResponse.json({ error: attemptError.message }, { status: 500 });
  }

  const { error: deleteError } = await admin.from("challenges").delete().eq("id", id);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  const path = storagePath(challenge.image_url);
  if (path) await admin.storage.from("challenge-images").remove([path]);

  return NextResponse.json({ ok: true });
}
