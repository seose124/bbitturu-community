export type ReportAttempt = {
  challengeId: number;
  userId?: string;
  answer: string;
  passed: boolean;
  correct: boolean;
  createdAt: string;
};

export type ChallengeReport = {
  challengeId: number;
  tries: number;
  correctCount: number;
  successRate: number;
  state: "waiting" | "collecting" | "ready" | "final";
  difficultyTitle: string;
  topWrongAnswers: Array<{ answer: string; count: number }>;
};

export function reportState(tries: number): ChallengeReport["state"] {
  if (tries === 0) return "waiting";
  if (tries < 5) return "collecting";
  if (tries < 10) return "ready";
  return "final";
}

export function difficultyTitle(successRate: number, tries: number) {
  if (tries === 0 || successRate === 0) return "아직 미제";
  if (successRate >= 70) return "살짝 삐뚤";
  if (successRate >= 40) return "제법 난해";
  if (successRate >= 20) return "눈물주의";
  return "인간 캡차";
}

function normalizeAnswer(answer: string) {
  return answer.trim().replace(/\s+/g, " ").toLocaleLowerCase("ko-KR");
}

export function buildChallengeReport(
  challengeId: number,
  attempts: ReportAttempt[],
  fallback?: { tries: number; successRate: number },
): ChallengeReport {
  const valid = attempts.filter(
    (attempt) => attempt.challengeId === challengeId && !attempt.passed,
  );
  const tries = valid.length || fallback?.tries || 0;
  const correctCount = valid.filter((attempt) => attempt.correct).length;
  const successRate = valid.length
    ? Math.round((correctCount / valid.length) * 100)
    : fallback?.successRate || 0;
  const wrongCounts = valid.reduce<Record<string, number>>((counts, attempt) => {
    if (attempt.correct || !attempt.answer.trim()) return counts;
    const answer = normalizeAnswer(attempt.answer);
    counts[answer] = (counts[answer] ?? 0) + 1;
    return counts;
  }, {});
  const topWrongAnswers = Object.entries(wrongCounts)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([answer, count]) => ({ answer, count }));

  return {
    challengeId,
    tries,
    correctCount,
    successRate,
    state: reportState(tries),
    difficultyTitle: difficultyTitle(successRate, tries),
    topWrongAnswers,
  };
}
