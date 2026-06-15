"use client";

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
import { type Challenge, type Difficulty } from "@/lib/challenges";

type Attempt = {
  answer: string;
  passed: boolean;
};

type AppContextValue = {
  user: User | null;
  challenges: Challenge[];
  hydrated: boolean;
  attempts: Record<number, Attempt>;
  addChallenge: (input: {
    handwriting?: string;
    imageData?: string;
    answer: string;
    hint?: string;
    difficulty?: Difficulty;
  }) => Promise<Challenge>;
  getChallenge: (id: number) => Challenge | undefined;
  saveAttempt: (id: number, answer: string, passed?: boolean) => void;
  deleteChallenge: (id: number) => Promise<void>;
  signOut: () => Promise<void>;
  resetApp: () => void;
  showToast: (message: string) => void;
};

const AppContext = createContext<AppContextValue | null>(null);
const ATTEMPTS_KEY = "bbiduru-attempts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToChallenge(row: Record<string, any>): Challenge {
  return {
    id: Number(row.id),
    handwriting: row.handwriting ?? "",
    imageData: row.image_url ?? undefined,
    answer: row.answer,
    author: row.author_name ?? "익명",
    authorId: row.author_id ?? undefined,
    difficulty: row.difficulty,
    successRate: row.success_rate ?? 0,
    tries: row.tries ?? 0,
    hint: row.hint ?? "",
    tags: row.tags ?? [],
  };
}

const supabase = createClient();

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [attempts, setAttempts] = useState<Record<number, Attempt>>({});
  const [toast, setToast] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auth state
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load challenges from Supabase
  useEffect(() => {
    supabase
      .from("challenges")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) {
          setChallenges(data.map(dbToChallenge));
        }
        setHydrated(true);
      });
  }, []);

  // Load attempts from localStorage
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(ATTEMPTS_KEY);
      if (saved) setAttempts(JSON.parse(saved));
    } catch {
      window.localStorage.removeItem(ATTEMPTS_KEY);
    }
  }, []);

  // Persist attempts to localStorage
  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts));
  }, [attempts, hydrated]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(""), 2400);
  }, []);

  const addChallenge = useCallback(
    async (input: {
      handwriting?: string;
      imageData?: string;
      answer: string;
      hint?: string;
      difficulty?: Difficulty;
    }) => {
      if (!user) throw new Error("로그인이 필요해요");

      let imageUrl: string | undefined;
      if (input.imageData) {
        const blob = await fetch(input.imageData).then((r) => r.blob());
        const path = `${user.id}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from("challenge-images")
          .upload(path, blob, { contentType: "image/jpeg" });
        if (!uploadError) {
          const {
            data: { publicUrl },
          } = supabase.storage.from("challenge-images").getPublicUrl(path);
          imageUrl = publicUrl;
        }
      }

      const autoHint =
        input.answer && input.answer !== "나도 못읽겠어요 🤷"
          ? `총 ${input.answer.replace(/\s/g, "").length}글자예요`
          : "힌트가 없어요";

      const { data, error } = await supabase
        .from("challenges")
        .insert({
          handwriting: input.handwriting ?? "",
          image_url: imageUrl ?? null,
          answer: input.answer,
          author_id: user.id,
          author_name: user.email?.split("@")[0] ?? "익명",
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
      setChallenges((current) => [challenge, ...current]);
      return challenge;
    },
    [user],
  );

  const getChallenge = useCallback(
    (id: number) => challenges.find((c) => c.id === id),
    [challenges],
  );

  const saveAttempt = useCallback(
    (id: number, answer: string, passed = false) => {
      setAttempts((current) => ({ ...current, [id]: { answer, passed } }));
    },
    [],
  );

  const deleteChallenge = useCallback(
    async (id: number) => {
      if (!user) throw new Error("로그인이 필요해요");
      const { error } = await supabase
        .from("challenges")
        .delete()
        .eq("id", id)
        .eq("author_id", user.id);
      if (error) throw error;
      setChallenges((current) => current.filter((c) => c.id !== id));
    },
    [user],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const resetApp = useCallback(() => {
    window.localStorage.removeItem(ATTEMPTS_KEY);
    setAttempts({});
    showToast("앱 데이터가 초기화됐어요");
  }, [showToast]);

  const value = useMemo(
    () => ({
      user,
      challenges,
      hydrated,
      attempts,
      addChallenge,
      getChallenge,
      saveAttempt,
      deleteChallenge,
      signOut,
      resetApp,
      showToast,
    }),
    [
      user,
      challenges,
      hydrated,
      attempts,
      addChallenge,
      getChallenge,
      saveAttempt,
      deleteChallenge,
      signOut,
      resetApp,
      showToast,
    ],
  );

  return (
    <AppContext.Provider value={value}>
      {children}
      <div className={`toast ${toast ? "toast-show" : ""}`} role="status">
        {toast}
      </div>
    </AppContext.Provider>
  );
}

export function useBbiduru() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useBbiduru must be used inside AppProvider");
  }
  return context;
}
