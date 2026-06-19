import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { applyContribution, defaultUserStats, getKstDate } from "@/lib/progression";
import { answerSimilarity } from "@/lib/similarity";

function statsFromRow(row: Record<string, unknown> | null) {
  if (!row) return defaultUserStats;
  return {
    interpreterXp: Number(row.interpreter_xp ?? 0),
    uploaderXp: Number(row.uploader_xp ?? 0),
    activityStreak: Number(row.activity_streak ?? 0),
    lastContributionDate: String(row.last_contribution_date ?? "") || null,
    dailyValidActivityCount: Number(row.daily_valid_activity_count ?? 0),
    dailyActivityDate: String(row.daily_activity_date ?? "") || null,
    dailyBonusDate: String(row.daily_bonus_date ?? "") || null,
    currentCombo: Number(row.current_combo ?? 0),
    maxCombo: Number(row.max_combo ?? 0),
    comboDate: String(row.combo_date ?? "") || null,
  };
}

function statsToRow(userId: string, stats: typeof defaultUserStats) {
  return {
    user_id: userId,
    interpreter_xp: stats.interpreterXp,
    uploader_xp: stats.uploaderXp,
    activity_streak: stats.activityStreak,
    last_contribution_date: stats.lastContributionDate,
    daily_valid_activity_count: stats.dailyValidActivityCount,
    daily_activity_date: stats.dailyActivityDate,
    daily_bonus_date: stats.dailyBonusDate,
    current_combo: stats.currentCombo,
    max_combo: stats.maxCombo,
    combo_date: stats.comboDate,
    updated_at: new Date().toISOString(),
  };
}

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
  const user = userData.user;
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
  if (!Number.isInteger(challengeId)) {
    return NextResponse.json({ error: "잘못된 챌린지예요" }, { status: 400 });
  }

  const { data: challenge, error: challengeError } = await admin
    .from("challenges")
    .select("id, answer, author_id, success_rate, tries")
    .eq("id", challengeId)
    .single();
  if (challengeError || !challenge) {
    return NextResponse.json({ error: "챌린지를 찾을 수 없어요" }, { status: 404 });
  }

  const { data: existing } = await admin
    .from("attempts")
    .select("*")
    .eq("challenge_id", challengeId)
    .eq("user_id", user.id)
    .maybeSingle();
  const { data: currentStatsRow } = await admin
    .from("user_stats")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({
      attempt: existing,
      stats: currentStatsRow,
      challenge_stats: {
        tries: challenge.tries,
        success_rate: challenge.success_rate,
      },
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
  const today = getKstDate();
  const { data: dailyCase } = await admin
    .from("daily_cases")
    .select("challenge_id")
    .eq("case_date", today)
    .eq("status", "active")
    .maybeSingle();
  const isDaily =
    valid &&
    (Number(dailyCase?.challenge_id) === challengeId ||
      (!dailyCase && Boolean(body.isDaily)));
  const baseXp = valid
    ? 5 +
      (correct ? 8 : 0) +
      (correct && Number(challenge.success_rate) < 30 ? 5 : 0) +
      (isDaily ? 3 : 0)
    : 0;
  const currentStats = statsFromRow(currentStatsRow);
  const nextStats = applyContribution(currentStats, {
    track: "interpreter",
    xp: baseXp,
    correct,
    valid,
  });
  const xpEarned = nextStats.interpreterXp - currentStats.interpreterXp;

  const { data: savedStats, error: statsError } = await admin
    .from("user_stats")
    .upsert(statsToRow(user.id, nextStats), { onConflict: "user_id" })
    .select("*")
    .single();
  if (statsError) {
    return NextResponse.json({ error: statsError.message }, { status: 500 });
  }

  const { data: attempt, error: attemptError } = await admin
    .from("attempts")
    .insert({
      challenge_id: challengeId,
      user_id: user.id,
      answer_raw: answer,
      answer_normalized: answer.replace(/\s/g, "").toLowerCase(),
      is_correct: correct,
      is_pass: passed,
      is_valid: valid,
      is_daily_case: isDaily,
      similarity_score: similarity,
      xp_earned: xpEarned,
      combo_after: nextStats.currentCombo,
    })
    .select("*")
    .single();
  if (attemptError || !attempt) {
    return NextResponse.json(
      { error: attemptError?.message ?? "판독 저장에 실패했어요" },
      { status: 500 },
    );
  }

  let tries = Number(challenge.tries ?? 0);
  let successRate = Number(challenge.success_rate ?? 0);
  if (valid) {
    const [validResult, correctResult] = await Promise.all([
      admin
        .from("attempts")
        .select("id", { head: true, count: "exact" })
        .eq("challenge_id", challengeId)
        .eq("is_valid", true)
        .eq("is_pass", false),
      admin
        .from("attempts")
        .select("id", { head: true, count: "exact" })
        .eq("challenge_id", challengeId)
        .eq("is_valid", true)
        .eq("is_pass", false)
        .eq("is_correct", true),
    ]);
    tries = validResult.count ?? 0;
    successRate = tries ? Math.round(((correctResult.count ?? 0) / tries) * 100) : 0;
    await admin
      .from("challenges")
      .update({ tries, success_rate: successRate })
      .eq("id", challengeId);
  }

  return NextResponse.json({
    attempt,
    stats: savedStats,
    challenge_stats: { tries, success_rate: successRate },
  });
}
