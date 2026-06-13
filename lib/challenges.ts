export type Difficulty = "쉬움" | "보통" | "어려움" | "악필의 끝";
export type ChallengeTag = "hot" | "new" | "hard" | "easy";

export type Challenge = {
  id: number;
  handwriting: string;
  answer: string;
  author: string;
  difficulty: Difficulty;
  successRate: number;
  tries: number;
  hint: string;
  tags: ChallengeTag[];
};

export const initialChallenges: Challenge[] = [
  {
    id: 1,
    handwriting: "오늘밥뭔데\n내일이야",
    answer: "오늘 밥 뭔데 내일이야",
    author: "햇살이",
    difficulty: "보통",
    successRate: 28,
    tries: 247,
    hint: "총 10글자예요",
    tags: ["hot"],
  },
  {
    id: 2,
    handwriting: "저기요\n잠깐만요",
    answer: "저기요 잠깐만요",
    author: "낙서왕",
    difficulty: "쉬움",
    successRate: 72,
    tries: 183,
    hint: "두 단어예요",
    tags: ["new", "easy"],
  },
  {
    id: 3,
    handwriting: "내일 회의\n9시니까\n잊지마",
    answer: "내일 회의 9시니까 잊지마",
    author: "악필의신",
    difficulty: "어려움",
    successRate: 12,
    tries: 89,
    hint: "총 12글자예요",
    tags: ["hard", "hot"],
  },
  {
    id: 4,
    handwriting: "엄마\n나 라면\n먹어도돼",
    answer: "엄마 나 라면 먹어도 돼",
    author: "뻔뻔123",
    difficulty: "보통",
    successRate: 45,
    tries: 312,
    hint: "엄마한테 쓴 메모",
    tags: ["new", "hot"],
  },
  {
    id: 5,
    handwriting: "택배\n집앞에\n두세요",
    answer: "택배 집 앞에 두세요",
    author: "집돌이",
    difficulty: "쉬움",
    successRate: 68,
    tries: 427,
    hint: "택배 메모예요",
    tags: ["hot", "easy"],
  },
  {
    id: 6,
    handwriting: "오늘저녁\n치킨시켜\n마늘소스",
    answer: "오늘 저녁 치킨 시켜 마늘소스",
    author: "치킨러버",
    difficulty: "악필의 끝",
    successRate: 5,
    tries: 41,
    hint: "음식 관련이에요",
    tags: ["hard"],
  },
];

export const difficultyClass: Record<Difficulty, string> = {
  쉬움: "difficulty-easy",
  보통: "difficulty-normal",
  어려움: "difficulty-hard",
  "악필의 끝": "difficulty-extreme",
};
