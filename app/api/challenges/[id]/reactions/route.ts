import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import {
  isReactionKey,
  parseReactionCounts,
  updateReactionTag,
} from "@/lib/reactions";

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const admin = getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Server auth is unavailable" }, { status: 503 });
  }

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { error: userError } = await admin.auth.getUser(token);
  if (userError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as { reaction?: unknown; active?: unknown };
  if (!isReactionKey(body.reaction) || typeof body.active !== "boolean") {
    return NextResponse.json({ error: "Invalid reaction" }, { status: 400 });
  }

  const { id: rawId } = await context.params;
  const id = Number(rawId);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid challenge" }, { status: 400 });
  }

  const { data: challenge, error: challengeError } = await admin
    .from("challenges")
    .select("tags")
    .eq("id", id)
    .maybeSingle();
  if (challengeError || !challenge) {
    return NextResponse.json(
      { error: challengeError?.message ?? "Challenge not found" },
      { status: challengeError ? 500 : 404 },
    );
  }

  const counts = parseReactionCounts(challenge.tags);
  counts[body.reaction] = Math.max(
    0,
    counts[body.reaction] + (body.active ? 1 : -1),
  );
  const tags = updateReactionTag(challenge.tags, body.reaction, counts[body.reaction]);
  const { error: updateError } = await admin.from("challenges").update({ tags }).eq("id", id);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ counts });
}
