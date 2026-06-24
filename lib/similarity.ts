function editDistance(a: string, b: string) {
  const matrix = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) =>
      j === 0 ? i : i === 0 ? j : 0,
    ),
  );

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      matrix[i][j] =
        a[i - 1] === b[j - 1]
          ? matrix[i - 1][j - 1]
          : 1 +
            Math.min(
              matrix[i - 1][j],
              matrix[i][j - 1],
              matrix[i - 1][j - 1],
            );
    }
  }

  return matrix[a.length][b.length];
}

/** 전체 글자수 대비 위치가 일치하는 글자수 비율 (공백·마침표·쉼표 제외, 대소문자 구분 없음) */
export function charMatchRate(answer: string, attempt: string): number {
  const normalize = (v: string) => v.replace(/[\s.,]/g, "").toLocaleLowerCase("ko-KR");
  const a = normalize(answer);
  const b = normalize(attempt);
  if (!a.length) return 0;
  let matches = 0;
  for (let i = 0; i < a.length; i++) {
    if (b[i] === a[i]) matches++;
  }
  return matches / a.length;
}

export function answerSimilarity(answer: string, attempt: string) {
  const normalize = (value: string) =>
    value.replace(/[\s.,]/g, "").toLocaleLowerCase("ko-KR");
  const a = normalize(answer);
  const b = normalize(attempt);

  if (a === b) return 1;
  const longer = a.length >= b.length ? a : b;
  const shorter = a.length >= b.length ? b : a;
  if (!longer.length) return 1;

  return (longer.length - editDistance(longer, shorter)) / longer.length;
}
