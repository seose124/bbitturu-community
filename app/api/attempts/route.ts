import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { answerSimilarity } from "@/lib/similarity";

export async function POST(request: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const accessToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!serviceKey || !supabaseUrl) {
    return NextResponse.json({ error: "서버 설정 오류" }, { status: 500 });
  }
  if (!accessToken) {
    return NextResponse.json({ error: "인증이 필요해요" }, { status: 401 });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await admin.auth.getUser(accessToken);
  const user = userData?.user;
  if (userError || !user) {
    return NextResponse.json({ error: "인증이 만료됐어요" }, { status: 401 });
  }

  const body = (await request.json()) as {
    challengeId?: number;
    answer?: string;
    passed?: boolean;
    isDaily?: boolean;
  };
  const challengeId = Number(body.challengeId);
  if (!Number.isInteger(challengeId) || challengeId <= 0) {
    return NextResponse.json({ error: "잘못된 챌린지예요" }, { status: 400 });
  }

  // Try the full RPC path first (requires migration to be applied)
  try {
    const userClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
    const { data: rpcData, error: rpcError } = await userClient.rpc("submit_attempt", {
      p_challenge_id: challengeId,
      p_answer: String(body.answer ?? "").trim(),
      p_is_pass: Boolean(body.passed),
      p_is_daily: Boolean(body.isDaily),
    });
    if (!rpcError && rpcData) {
      return NextResponse.json(rpcData);
    }
    // RPC not available (migration not applied) — fall through to legacy path
  } catch {
    // continue to legacy path
  }

  // --- Legacy path: works with the pre-migration schema ---
  const { data: challenge, error: challengeError } = await admin
    .from("challenges")
    .select("id, answer, author_id, success_rate, tries")
    .eq("id", challengeId)
    .single();
  if (challengeError || !challenge) {
    return NextResponse.json({ error: "챌린지를 찾을 수 없어요" }, { status: 404 });
  }

  // Check existing attempt (column name varies by schema)
  const { data: existing } = await admin
    .from("attempts")
    .select("*")
    .eq("challenge_id", challengeId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      attempt: existing,
      stats: null,
      challenge_stats: { tries: challenge.tries, success_rate: challenge.success_rate },
    });
  }

  const answer = String(body.answer ?? "").trim();
  const passed = Boolean(body.passed);
  const similarity = passed ? 0 : answerSimilarity(String(challenge.answer), answer);
  const correct = !passed && similarity > 0.55;
  const valid =
    !passed &&
    answer.replace(/\s/g, "").length >= 2 &&
    challenge.author_id !== user.id;

  // Insert using the user's own token so the authenticated role can use the sequence
  const userInsertClient = createClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    },
  );
  const { data: attempt, error: attemptError } = await userInsertClient
    .from("attempts")
    .insert({
      challenge_id: challengeId,
      user_id: user.id,
      answer,
      passed,
      created_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (attemptError || !attempt) {
    return NextResponse.json(
      { error: attemptError?.message ?? "판독 저장에 실패했어요" },
      { status: 500 },
    );
  }

  // Update challenge tries/success_rate
  let tries = Number(challenge.tries ?? 0);
  let successRate = Number(challenge.success_rate ?? 0);

  if (valid) {
    // Count all non-passed attempts for this challenge
    const { count: validCount } = await admin
      .from("attempts")
      .select("id", { head: true, count: "exact" })
      .eq("challenge_id", challengeId)
      .eq("passed", false);

    // Fetch answers to compute success rate
    const { data: allAttempts } = await admin
      .from("attempts")
      .select("answer, user_id")
      .eq("challenge_id", challengeId)
      .eq("passed", false);

    tries = validCount ?? 0;

    if (allAttempts && allAttempts.length > 0) {
      const correctCount = allAttempts.filter(
        (a) => answerSimilarity(String(challenge.answer), String(a.answer)) > 0.55,
      ).length;
      successRate = tries > 0 ? Math.round((correctCount / tries) * 100) : 0;
    }

    await admin
      .from("challenges")
      .update({ tries, success_rate: successRate })
      .eq("id", challengeId);
  }

  // Map to expected response shape (shimming missing fields)
  const attemptShim = {
    ...attempt,
    answer_raw: attempt.answer ?? answer,
    is_pass: attempt.passed ?? passed,
    is_correct: correct,
    is_valid: valid,
    is_daily_case: false,
    similarity_score: similarity,
    xp_earned: 0,
    combo_after: 0,
  };

  return NextResponse.json({
    attempt: attemptShim,
    stats: null,
    challenge_stats: { tries, success_rate: successRate },
  });
}
