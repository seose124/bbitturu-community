"use client";

export function ColorizedAnswer({
  answer,
  attempt,
}: {
  answer: string;
  attempt: string;
}) {
  const normAnswer = answer.replace(/[\s.,]/g, "").toLocaleLowerCase("ko-KR");
  let normIdx = 0;

  const chars = attempt.split("").map((char) => {
    if (char === " " || char === "." || char === ",")
      return { char, correct: null as boolean | null };
    const normChar = char.toLocaleLowerCase("ko-KR");
    const correct = normIdx < normAnswer.length && normChar === normAnswer[normIdx];
    normIdx++;
    return { char, correct };
  });

  return (
    <>
      &ldquo;
      {chars.map((item, i) =>
        item.correct === null ? (
          <span key={i}>{item.char}</span>
        ) : (
          <span key={i} className={item.correct ? "char-correct" : "char-wrong"}>
            {item.char}
          </span>
        ),
      )}
      &rdquo;
    </>
  );
}
