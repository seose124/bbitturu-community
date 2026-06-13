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
import {
  initialChallenges,
  type Challenge,
  type Difficulty,
} from "@/lib/challenges";

type Attempt = {
  answer: string;
  passed: boolean;
};

type AppContextValue = {
  challenges: Challenge[];
  hydrated: boolean;
  attempts: Record<number, Attempt>;
  addChallenge: (input: {
    handwriting: string;
    answer: string;
    difficulty: Difficulty;
  }) => Challenge;
  getChallenge: (id: number) => Challenge | undefined;
  saveAttempt: (id: number, answer: string, passed?: boolean) => void;
  resetApp: () => void;
  showToast: (message: string) => void;
};

const AppContext = createContext<AppContextValue | null>(null);
const CHALLENGES_KEY = "bbiduru-challenges";
const ATTEMPTS_KEY = "bbiduru-attempts";

export function AppProvider({ children }: { children: ReactNode }) {
  const [challenges, setChallenges] = useState(initialChallenges);
  const [attempts, setAttempts] = useState<Record<number, Attempt>>({});
  const [toast, setToast] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const hydrateTimer = window.setTimeout(() => {
      try {
        const savedChallenges = window.localStorage.getItem(CHALLENGES_KEY);
        const savedAttempts = window.localStorage.getItem(ATTEMPTS_KEY);
        if (savedChallenges) setChallenges(JSON.parse(savedChallenges));
        if (savedAttempts) setAttempts(JSON.parse(savedAttempts));
      } catch {
        window.localStorage.removeItem(CHALLENGES_KEY);
        window.localStorage.removeItem(ATTEMPTS_KEY);
      } finally {
        setHydrated(true);
      }
    }, 0);

    return () => window.clearTimeout(hydrateTimer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(CHALLENGES_KEY, JSON.stringify(challenges));
  }, [challenges, hydrated]);

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
    (input: {
      handwriting: string;
      answer: string;
      difficulty: Difficulty;
    }) => {
      const challenge: Challenge = {
        id: Date.now(),
        handwriting: input.handwriting,
        answer: input.answer,
        author: "나",
        difficulty: input.difficulty,
        successRate: Math.floor(Math.random() * 55) + 5,
        tries: 0,
        hint: `총 ${input.answer.replace(/\s/g, "").length}글자예요`,
        tags: ["new"],
      };
      setChallenges((current) => [challenge, ...current]);
      return challenge;
    },
    [],
  );

  const getChallenge = useCallback(
    (id: number) => challenges.find((challenge) => challenge.id === id),
    [challenges],
  );

  const saveAttempt = useCallback(
    (id: number, answer: string, passed = false) => {
      setAttempts((current) => ({
        ...current,
        [id]: { answer, passed },
      }));
    },
    [],
  );

  const resetApp = useCallback(() => {
    window.localStorage.removeItem(CHALLENGES_KEY);
    window.localStorage.removeItem(ATTEMPTS_KEY);
    setChallenges(initialChallenges);
    setAttempts({});
    showToast("앱 데이터가 초기화됐어요");
  }, [showToast]);

  const value = useMemo(
    () => ({
      challenges,
      hydrated,
      attempts,
      addChallenge,
      getChallenge,
      saveAttempt,
      resetApp,
      showToast,
    }),
    [
      challenges,
      hydrated,
      attempts,
      addChallenge,
      getChallenge,
      saveAttempt,
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
