"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";
import { initAnalytics, identifyUser } from "@/lib/analytics";
import { answerSimilarity } from "@/lib/similarity";
import {
  deriveChallengeTags,
  type Challenge,
  type Difficulty,
} from "@/lib/challenges";
import {
  applyContribution,
  comboMilestoneMessage,
  defaultUserStats,
  getKstDate,
  getLevel,
  type UserStats,
} from "@/lib/progression";
import {
  buildChallengeReport,
  type ChallengeReport,
  type ReportAttempt,
} from "@/lib/reports";
import { resetClientForPublicLaunch } from "@/lib/client-reset";
import { parseReactionCounts } from "@/lib/reactions";

export type Attempt = {
  answer: string;
  passed: boolean;
  correct: boolean;
  similarity: number;
  xpEarned: number;
  comboAfter: number;
  createdAt: string;
  isDaily: boolean;
};

export type AppNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  challengeId?: number;
  readAt: string | null;
  createdAt: string;
};

type LoginPromptReason = "level" | "report" | null;

type AppContextValue = {
  user: User | null;
  isAnonymous: boolean;
  challenges: Challenge[];
  hydrated: boolean;
  attempts: Record<number, Attempt>;
  stats: UserStats;
  dailyChallenge?: Challenge;
  dailyChallenges: Challenge[];
  dailyProgress: number;
  notifications: AppNotification[];
  unreadCount: number;
  unreadReportCount: number;
  loginPrompt: LoginPromptReason;
  addChallenge: (input: {
    handwriting?: string;
    imageData?: string;
    answer: string;
    hint?: string;
    difficulty?: Difficulty;
    author?: string;
  }) => Promise<Challenge>;
  getChallenge: (id: number) => Challenge | undefined;
  getChallengeReport: (id: number) => ChallengeReport;
  saveAttempt: (
    id: number,
    answer: string,
    passed?: boolean,
  ) => Promise<Attempt>;
  deleteChallenge: (id: number) => Promise<void>;
  signOut: () => Promise<void>;
  signalInterest: (challengeId: number) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markReportSeen: (challengeId: number) => Promise<void>;
  dismissLoginPrompt: () => void;
  resetApp: () => void;
  showToast: (message: string) => void;
};

const AppContext = createContext<AppContextValue | null>(null);
const ATTEMPTS_KEY = "bbiduru-attempts";
const STATS_KEY = "bbiduru-user-stats";
const REPORT_ATTEMPTS_KEY = "bbiduru-report-attempts";
const NOTIFICATIONS_KEY = "bbiduru-notifications";
const LOGIN_PROMPT_KEY = "bbiduru-login-prompt-seen";

function normalizeStoredAttempts(value: string): Record<number, Attempt> {
  const parsed = JSON.parse(value) as Record<string, Partial<Attempt>>;
  return Object.fromEntries(
    Object.entries(parsed).map(([id, attempt]) => [
      Number(id),
      {
        answer: attempt.answer ?? "",
        passed: Boolean(attempt.passed),
        correct: Boolean(attempt.correct),
        similarity: Number(attempt.similarity ?? 0),
        xpEarned: Number(attempt.xpEarned ?? 0),
        comboAfter: Number(attempt.comboAfter ?? 0),
        createdAt: attempt.createdAt ?? new Date().toISOString(),
        isDaily: Boolean(attempt.isDaily),
      },
    ]),
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToChallenge(row: Record<string, any>): Challenge {
  const challenge: Challenge = {
    id: Number(row.id),
    handwriting: row.handwriting ?? "",
    imageData: row.image_url ?? undefined,
    answer: row.answer,
    author: row.author_name ?? "익명의 악필러",
    authorId: row.author_id ?? undefined,
    difficulty: row.difficulty,
    successRate: row.success_rate ?? 0,
    tries: row.tries ?? 0,
    hint: row.hint ?? "",
    tags: [],
    reactionCounts: parseReactionCounts(row.tags),
    createdAt: row.created_at ?? undefined,
  };
  challenge.tags = deriveChallengeTags(challenge);
  return challenge;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToStats(row: Record<string, any>): UserStats {
  return {
    interpreterXp: Number(row.interpreter_xp ?? 0),
    uploaderXp: Number(row.uploader_xp ?? 0),
    activityStreak: Number(row.activity_streak ?? 0),
    lastContributionDate: row.last_contribution_date ?? null,
    dailyValidActivityCount: Number(row.daily_valid_activity_count ?? 0),
    dailyActivityDate: row.daily_activity_date ?? null,
    dailyBonusDate: row.daily_bonus_date ?? null,
    currentCombo: Number(row.current_combo ?? 0),
    maxCombo: Number(row.max_combo ?? 0),
    comboDate: row.combo_date ?? null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToAttempt(row: Record<string, any>): Attempt {
  // Support both new schema (answer_raw/is_pass) and old schema (answer/passed)
  return {
    answer: row.answer_raw ?? row.answer ?? "",
    passed: Boolean(row.is_pass ?? row.passed),
    correct: Boolean(row.is_correct),
    similarity: Number(row.similarity_score ?? 0),
    xpEarned: Number(row.xp_earned ?? 0),
    comboAfter: Number(row.combo_after ?? 0),
    createdAt: row.created_at ?? new Date().toISOString(),
    isDaily: Boolean(row.is_daily_case),
  };
}

function deriveCurrentCombo(
  rows: Array<{
    user_id?: string;
    is_pass?: boolean;
    passed?: boolean;
    is_correct?: boolean;
  }>,
  userId: string,
) {
  let combo = 0;
  for (const row of rows) {
    if (row.user_id !== userId) continue;
    if ((row.is_pass ?? row.passed) || !row.is_correct) break;
    combo += 1;
  }
  return combo;
}

function isTodayDailyAttempt(attempt?: Attempt) {
  return Boolean(
    attempt?.isDaily && getKstDate(new Date(attempt.createdAt)) === getKstDate(),
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToReportAttempt(row: Record<string, any>): ReportAttempt {
  return {
    challengeId: Number(row.challenge_id),
    userId: row.user_id ?? undefined,
    answer: row.answer_raw ?? row.answer ?? "",
    passed: Boolean(row.is_pass ?? row.passed),
    correct: Boolean(row.is_correct),
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToNotification(row: Record<string, any>): AppNotification {
  return {
    id: String(row.id),
    type: row.type,
    title: row.title,
    body: row.body,
    challengeId: row.challenge_id ? Number(row.challenge_id) : undefined,
    readAt: row.read_at ?? null,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

const supabase = createClient();

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [attempts, setAttempts] = useState<Record<number, Attempt>>({});
  const [reportAttempts, setReportAttempts] = useState<ReportAttempt[]>([]);
  const [stats, setStats] = useState<UserStats>(defaultUserStats);
  const [dailyChallengeId, setDailyChallengeId] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loginPrompt, setLoginPrompt] = useState<LoginPromptReason>(null);
  const [toast, setToast] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [clientInitialized, setClientInitialized] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAnonymous = Boolean(user?.is_anonymous);

  useEffect(() => {
    resetClientForPublicLaunch();
    queueMicrotask(() => setClientInitialized(true));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const didReset = resetClientForPublicLaunch();
    initAnalytics(undefined);

    async function initializeUser() {
      if (didReset) {
        await supabase.auth.signOut({ scope: "local" });
      }
      let {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      let verifiedUser: User | null = null;
      if (session) {
        const {
          data: { user: currentUser },
          error: verifyError,
        } = await supabase.auth.getUser();
        if (verifyError || !currentUser) {
          await supabase.auth.signOut({ scope: "local" });
          session = null;
        } else {
          verifiedUser = currentUser;
        }
      }
      if (!session) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (cancelled) return;
        if (error) {
          console.error("[bbiduru] 익명 로그인 실패:", error.message);
          return;
        }
        if (data.user) identifyUser(data.user.id);
        setUser(data.user);
      } else {
        identifyUser(verifiedUser!.id);
        setUser(verifiedUser);
      }
    }

    void initializeUser();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) identifyUser(session.user.id);
      setUser(session?.user ?? null);
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    resetClientForPublicLaunch();
    try {
      const savedAttempts = window.localStorage.getItem(ATTEMPTS_KEY);
      const savedStats = window.localStorage.getItem(STATS_KEY);
      const savedReports = window.localStorage.getItem(REPORT_ATTEMPTS_KEY);
      const savedNotifications = window.localStorage.getItem(NOTIFICATIONS_KEY);
      queueMicrotask(() => {
        if (savedAttempts) setAttempts(normalizeStoredAttempts(savedAttempts));
        if (savedStats) setStats({ ...defaultUserStats, ...JSON.parse(savedStats) });
        if (savedReports) setReportAttempts(JSON.parse(savedReports));
        if (savedNotifications) setNotifications(JSON.parse(savedNotifications));
      });
    } catch {
      window.localStorage.removeItem(ATTEMPTS_KEY);
      window.localStorage.removeItem(STATS_KEY);
      window.localStorage.removeItem(REPORT_ATTEMPTS_KEY);
      window.localStorage.removeItem(NOTIFICATIONS_KEY);
    }
  }, []);

  useEffect(() => {
    supabase
      .from("challenges")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setChallenges(data.map(dbToChallenge));
        setHydrated(true);
      });
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function loadProgress() {
      const today = getKstDate();
      const [attemptResult, statsResult, notificationResult, dailyResult] =
        await Promise.all([
          supabase.from("attempts").select("*").order("created_at", { ascending: false }),
          supabase.from("user_stats").select("*").eq("user_id", user!.id).maybeSingle(),
          supabase.from("notifications").select("*").order("created_at", { ascending: false }),
          supabase
            .from("daily_cases")
            .select("challenge_id")
            .eq("case_date", today)
            .eq("status", "active")
            .maybeSingle(),
        ]);
      if (cancelled) return;

      let derivedCombo: number | null = null;
      if (!attemptResult.error && attemptResult.data) {
        const ownAttempts: Record<number, Attempt> = {};
        for (const row of attemptResult.data) {
          if (row.user_id === user!.id) {
            ownAttempts[Number(row.challenge_id)] = dbToAttempt(row);
          }
        }
        setAttempts((current) => ({ ...current, ...ownAttempts }));
        setReportAttempts(attemptResult.data.map(dbToReportAttempt));
        derivedCombo = deriveCurrentCombo(attemptResult.data, user!.id);
      }
      if (!statsResult.error) {
        const loadedStats = statsResult.data
          ? dbToStats(statsResult.data)
          : defaultUserStats;
        setStats(
          derivedCombo === null
            ? loadedStats
            : {
                ...loadedStats,
                currentCombo: derivedCombo,
                maxCombo: Math.max(loadedStats.maxCombo, derivedCombo),
              },
        );
      }
      if (!notificationResult.error && notificationResult.data) {
        setNotifications(notificationResult.data.map(dbToNotification));
      }
      if (!dailyResult.error && dailyResult.data) {
        setDailyChallengeId(Number(dailyResult.data.challenge_id));
      }
    }

    void loadProgress();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts));
    window.localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    window.localStorage.setItem(REPORT_ATTEMPTS_KEY, JSON.stringify(reportAttempts));
    window.localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  }, [attempts, hydrated, notifications, reportAttempts, stats]);

  const dailyChallenge = useMemo(() => {
    const selected = dailyChallengeId
      ? challenges.find((challenge) => challenge.id === dailyChallengeId)
      : undefined;
    if (selected) return selected;
    if (!challenges.length) return undefined;
    const preferred = challenges.filter(
      (challenge) => challenge.tries >= 3 && challenge.successRate < 35,
    );
    const candidates = preferred.length ? preferred : challenges;
    const dayNumber = Math.floor(
      new Date(`${getKstDate()}T00:00:00+09:00`).getTime() / 86_400_000,
    );
    return candidates[Math.abs(dayNumber) % candidates.length];
  }, [challenges, dailyChallengeId]);

  const dailyChallenges = useMemo(() => {
    if (!challenges.length) return [];
    const withTries = challenges.filter((c) => c.tries >= 3);
    const pool = withTries.length >= 3 ? withTries : challenges;
    return [...pool].sort((a, b) => a.successRate - b.successRate).slice(0, 3);
  }, [challenges]);

  const dailyProgress =
    stats.dailyActivityDate === getKstDate()
      ? Math.min(3, stats.dailyValidActivityCount)
      : 0;
  const unreadCount = notifications.filter((item) => !item.readAt).length;
  const unreadReportCount = notifications.filter(
    (item) => !item.readAt && ["first_attempt", "report_ready", "report_final"].includes(item.type),
  ).length;

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(""), 2400);
  }, []);

  const maybePromptLogin = useCallback(
    (reason: Exclude<LoginPromptReason, null>) => {
      if (!user?.is_anonymous) return;
      if (window.localStorage.getItem(LOGIN_PROMPT_KEY)) return;
      setLoginPrompt(reason);
    },
    [user],
  );

  useEffect(() => {
    if (
      isAnonymous &&
      notifications.some((item) => !item.readAt && item.type === "report_ready")
    ) {
      queueMicrotask(() => maybePromptLogin("report"));
    }
  }, [isAnonymous, maybePromptLogin, notifications]);

  const dismissLoginPrompt = useCallback(() => {
    window.localStorage.setItem(LOGIN_PROMPT_KEY, "true");
    setLoginPrompt(null);
  }, []);

  const getChallenge = useCallback(
    (id: number) => challenges.find((challenge) => challenge.id === id),
    [challenges],
  );

  const getChallengeReport = useCallback(
    (id: number) => {
      const challenge = challenges.find((item) => item.id === id);
      // Re-derive correct from similarity when is_correct is missing (old schema rows)
      const enriched = challenge
        ? reportAttempts.map((a) => ({
            ...a,
            correct:
              a.correct ||
              (!a.passed &&
                a.challengeId === id &&
                answerSimilarity(challenge.answer, a.answer) > 0.55),
          }))
        : reportAttempts;
      return buildChallengeReport(id, enriched, {
        tries: challenge?.tries ?? 0,
        successRate: challenge?.successRate ?? 0,
      });
    },
    [challenges, reportAttempts],
  );

  const addChallenge = useCallback(
    async (input: {
      handwriting?: string;
      imageData?: string;
      answer: string;
      hint?: string;
      difficulty?: Difficulty;
      author?: string;
    }) => {
      if (!user) throw new Error("잠시 후 다시 시도해주세요");

      let imageUrl: string | undefined;
      if (input.imageData) {
        const blob = await fetch(input.imageData).then((response) => response.blob());
        const path = `${user.id}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from("challenge-images")
          .upload(path, blob, { contentType: "image/jpeg" });
        if (uploadError) throw uploadError;
        const {
          data: { publicUrl },
        } = supabase.storage.from("challenge-images").getPublicUrl(path);
        imageUrl = publicUrl;
      }

      const autoHint = input.answer
        ? `총 ${input.answer.replace(/\s/g, "").length}글자예요`
        : "힌트가 없어요";
      const { data, error } = await supabase
        .from("challenges")
        .insert({
          handwriting: input.handwriting ?? "",
          image_url: imageUrl ?? null,
          answer: input.answer,
          author_id: user.id,
          author_name: input.author?.trim() || "익명의 악필러",
          difficulty: input.difficulty ?? "보통",
          hint: input.hint ?? autoHint,
          tags: ["new"],
          success_rate: 0,
          tries: 0,
        })
        .select()
        .single();
      if (error) throw error;

      const challenge = dbToChallenge(data);
      const previousLevel = getLevel("uploader", stats.uploaderXp).current.level;
      const nextStats = applyContribution(stats, {
        track: "uploader",
        xp: 5,
        valid: true,
      });
      setChallenges((current) => [challenge, ...current]);
      setStats(nextStats);
      if (getLevel("uploader", nextStats.uploaderXp).current.level > previousLevel) {
        maybePromptLogin("level");
      }
      return challenge;
    },
    [maybePromptLogin, stats, user],
  );

  const saveAttempt = useCallback(
    async (id: number, answer: string, passed = false) => {
      const existing = attempts[id];
      const challenge = challenges.find((item) => item.id === id);
      if (!challenge) throw new Error("챌린지를 찾을 수 없어요");
      const isDaily = dailyChallenges.some((c) => c.id === id);
      if (existing && (!isDaily || isTodayDailyAttempt(existing))) {
        return existing;
      }

      const cleanAnswer = answer.trim();
      const similarity = passed ? 0 : answerSimilarity(challenge.answer, cleanAnswer);
      const correct = !passed && similarity > 0.55;
      const valid =
        !passed &&
        cleanAnswer.replace(/\s/g, "").length >= 2 &&
        challenge.authorId !== user?.id;
      const baseXp = valid
        ? 5 + (correct ? 8 : 0) + (correct && challenge.successRate < 30 ? 5 : 0) + (isDaily ? 3 : 0)
        : 0;
      const previousLevel = getLevel("interpreter", stats.interpreterXp).current.level;
      const nextStats = applyContribution(stats, {
        track: "interpreter",
        xp: baseXp,
        correct,
        valid,
      });
      const xpEarned = nextStats.interpreterXp - stats.interpreterXp;
      const attempt: Attempt = {
        answer: cleanAnswer,
        passed,
        correct,
        similarity,
        xpEarned,
        comboAfter: nextStats.currentCombo,
        createdAt: new Date().toISOString(),
        isDaily,
      };

      setAttempts((current) => ({ ...current, [id]: attempt }));
      setStats(nextStats);
      setReportAttempts((current) => [
        ...current,
        {
          challengeId: id,
          userId: user?.id,
          answer: cleanAnswer,
          passed,
          correct,
          createdAt: attempt.createdAt,
        },
      ]);
      if (valid) {
        setChallenges((current) =>
          current.map((item) => {
            if (item.id !== id) return item;
            const tries = item.tries + 1;
            const previousCorrect = Math.round((item.successRate / 100) * item.tries);
            const successRate = Math.round(((previousCorrect + (correct ? 1 : 0)) / tries) * 100);
            return { ...item, tries, successRate };
          }),
        );
      }

      let persistedAttempt = attempt;
      let persistedStats = nextStats;
      if (user) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        let savedData;
        if (session) {
          const response = await fetch("/api/attempts", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              challengeId: id,
              answer: cleanAnswer,
              passed,
              isDaily,
            }),
          });
          if (response.ok) savedData = await response.json();
        }
        if (savedData?.attempt) {
          persistedAttempt = dbToAttempt(savedData.attempt);
          setAttempts((current) => ({ ...current, [id]: persistedAttempt }));
        }
        if (savedData?.stats) {
          persistedStats = dbToStats(savedData.stats);
          setStats(persistedStats);
        }
        if (savedData?.challenge_stats) {
          setChallenges((current) =>
            current.map((item) => {
              if (item.id !== id) return item;
              const updated = {
                ...item,
                tries: Number(savedData.challenge_stats.tries ?? item.tries),
                successRate: Number(
                  savedData.challenge_stats.success_rate ?? item.successRate,
                ),
              };
              return { ...updated, tags: deriveChallengeTags(updated) };
            }),
          );
        }
      }

      if (getLevel("interpreter", persistedStats.interpreterXp).current.level > previousLevel) {
        maybePromptLogin("level");
      }
      const comboMilestone = comboMilestoneMessage(persistedAttempt.comboAfter);
      if (persistedAttempt.correct && comboMilestone) {
        showToast(`${persistedAttempt.comboAfter}콤보 달성 · ${comboMilestone}`);
      }
      return persistedAttempt;
    },
    [attempts, challenges, dailyChallenge?.id, maybePromptLogin, showToast, stats, user],
  );

  const deleteChallenge = useCallback(
    async (id: number) => {
      if (!user) throw new Error("로그인이 필요해요");
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const response = await fetch(`/api/challenges/${id}`, {
        method: "DELETE",
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined,
      });
      if (!response.ok) throw new Error("챌린지를 삭제하지 못했어요");
      setChallenges((current) => current.filter((challenge) => challenge.id !== id));
      setAttempts((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      setReportAttempts((current) =>
        current.filter((attempt) => attempt.challengeId !== id),
      );
      window.localStorage.removeItem(`bbitturu-reactions:${id}`);
    },
    [user],
  );

  const markNotificationRead = useCallback(async (id: string) => {
    const readAt = new Date().toISOString();
    setNotifications((current) =>
      current.map((item) => (item.id === id ? { ...item, readAt } : item)),
    );
    await supabase.from("notifications").update({ read_at: readAt }).eq("id", id);
  }, []);

  const markReportSeen = useCallback(async (challengeId: number) => {
    const readAt = new Date().toISOString();
    const reportTypes = ["first_attempt", "report_ready", "report_final"];
    setNotifications((current) =>
      current.map((item) =>
        item.challengeId === challengeId && reportTypes.includes(item.type)
          ? { ...item, readAt }
          : item,
      ),
    );
    await supabase
      .from("notifications")
      .update({ read_at: readAt })
      .eq("challenge_id", challengeId)
      .in("type", reportTypes);
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const signalInterest = useCallback(
    async (challengeId: number) => {
      await supabase.from("interest_signals").insert({
        challenge_id: challengeId,
        user_id: user?.id ?? null,
      });
    },
    [user],
  );

  const resetApp = useCallback(() => {
    for (const key of [
      ATTEMPTS_KEY,
      STATS_KEY,
      REPORT_ATTEMPTS_KEY,
      NOTIFICATIONS_KEY,
      LOGIN_PROMPT_KEY,
    ]) {
      window.localStorage.removeItem(key);
    }
    setAttempts({});
    setStats(defaultUserStats);
    setReportAttempts([]);
    setNotifications([]);
    showToast("앱 데이터가 초기화됐어요");
  }, [showToast]);

  const value = useMemo(
    () => ({
      user,
      isAnonymous,
      challenges,
      hydrated,
      attempts,
      stats,
      dailyChallenge,
      dailyChallenges,
      dailyProgress,
      notifications,
      unreadCount,
      unreadReportCount,
      loginPrompt,
      addChallenge,
      getChallenge,
      getChallengeReport,
      saveAttempt,
      deleteChallenge,
      signOut,
      signalInterest,
      markNotificationRead,
      markReportSeen,
      dismissLoginPrompt,
      resetApp,
      showToast,
    }),
    [
      user,
      isAnonymous,
      challenges,
      hydrated,
      attempts,
      stats,
      dailyChallenge,
      dailyChallenges,
      dailyProgress,
      notifications,
      unreadCount,
      unreadReportCount,
      loginPrompt,
      addChallenge,
      getChallenge,
      getChallengeReport,
      saveAttempt,
      deleteChallenge,
      signOut,
      signalInterest,
      markNotificationRead,
      markReportSeen,
      dismissLoginPrompt,
      resetApp,
      showToast,
    ],
  );

  if (!clientInitialized) return null;

  return (
    <AppContext.Provider value={value}>
      {children}
      <div className={`toast ${toast ? "toast-show" : ""}`} role="status">
        {toast}
      </div>
      {loginPrompt ? (
        <div className="login-prompt-backdrop" role="presentation">
          <section
            className="login-prompt card outlined"
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-prompt-title"
          >
            <span className="badge badge-level">
              {loginPrompt === "level" ? "첫 레벨업" : "첫 리포트 도착"}
            </span>
            <h2 id="login-prompt-title">내 기록을 저장해둘까요?</h2>
            <p>기기에서 사라지기 전에 레벨과 리포트를 이메일에 안전하게 이어두세요.</p>
            <Link
              className="button button-green"
              href={`/login?reason=${loginPrompt}&next=${
                loginPrompt === "report" ? "/profile/uploads" : "/profile"
              }`}
              onClick={dismissLoginPrompt}
            >
              기록 저장하기
            </Link>
            <button className="button-text" type="button" onClick={dismissLoginPrompt}>
              지금은 익명으로 계속하기
            </button>
          </section>
        </div>
      ) : null}
    </AppContext.Provider>
  );
}

export function useBbiduru() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useBbiduru must be used inside AppProvider");
  return context;
}
