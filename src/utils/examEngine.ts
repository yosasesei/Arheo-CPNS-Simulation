import type {
  ActiveExamSession,
  BadgeId,
  CategoryCounts,
  CategoryScore,
  DrillConfig,
  ExamHistory,
  ExamMode,
  ExamResult,
  OptionKey,
  Question,
  QuestionAttemptMap,
  QuestionCategory,
  RawBankSoalFile,
  RawFlatQuestion,
  RawNestedQuestion,
  SubtestAnalysisItem,
  UserStats,
} from '../types/exam';

export const PASSING_GRADES = {
  TWK: 65,
  TIU: 80,
  TKP: 166,
} as const;

export const CAT_BKN_QUOTAS = {
  TWK: 30,
  TIU: 35,
  TKP: 45,
} as const;

export const EXAM_DURATIONS_SECONDS: Record<ExamMode, number> = {
  CAT_BKN: 100 * 60, // 100 menit
  ARCADE: 5 * 60, // 5 menit
  DRILL: 10 * 60, // 10 menit untuk latihan fokus 10 soal
};

export const ARCADE_QUESTION_COUNT = 15;
export const DEFAULT_DRILL_COUNT = 10;
export const XP_PER_LEVEL = 500;

export const ALL_BADGES: Array<{
  id: BadgeId;
  title: string;
  description: string;
}> = [
  {
    id: 'Lulus PG Pertama',
    title: 'Lulus PG Pertama',
    description: 'Menembus ambang batas TWK, TIU, dan TKP sekaligus.',
  },
  {
    id: 'Master TWK',
    title: 'Master TWK',
    description: 'Mencapai skor TWK >= 110 pada simulasi.',
  },
  {
    id: 'Kilat TIU',
    title: 'Kilat TIU',
    description: 'Mencapai skor TIU >= 120 atau combo 5x di Arena Cepat.',
  },
  {
    id: 'Bijak TKP',
    title: 'Bijak TKP',
    description: 'Mencapai skor TKP >= 190 pada simulasi.',
  },
];

const OPTION_KEYS: OptionKey[] = ['A', 'B', 'C', 'D', 'E'];

function normalizeCategory(raw: string): QuestionCategory {
  const upper = (raw || '').trim().toUpperCase();
  if (upper === 'TWK' || upper === 'TIU' || upper === 'TKP') {
    return upper;
  }
  return 'TWK';
}

function normalizeOptionKey(raw: string | undefined): OptionKey {
  const upper = (raw || 'A').trim().toUpperCase();
  if (upper === 'A' || upper === 'B' || upper === 'C' || upper === 'D' || upper === 'E') {
    return upper;
  }
  return 'A';
}

export function cleanDisplayText(input: string | null | undefined): string {
  if (!input) return '';
  return input
    .replace(/\r\n/g, '\n')
    .replace(/([a-zA-Z])-\s*\n\s*([a-zA-Z])/g, '$1$2')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function buildStableQuestionId(
  kategori: QuestionCategory,
  rawId: string | number,
  fallbackIndex: number
): { id: string; numericId: number } {
  if (typeof rawId === 'number' && Number.isFinite(rawId)) {
    return {
      id: `${kategori}-${String(rawId).padStart(3, '0')}`,
      numericId: rawId,
    };
  }
  const str = String(rawId || '').trim();
  if (!str) {
    return {
      id: `${kategori}-IMP-${fallbackIndex + 1}`,
      numericId: fallbackIndex + 1,
    };
  }
  const numMatch = str.match(/\d+/);
  const numericId = numMatch ? Number(numMatch[0]) : fallbackIndex + 1;
  return {
    id: str,
    numericId,
  };
}

function isFlatQuestion(item: unknown): item is RawFlatQuestion {
  return Boolean(
    item &&
      typeof item === 'object' &&
      'question' in item &&
      'optionA' in item
  );
}

function isNestedQuestion(item: unknown): item is RawNestedQuestion {
  return Boolean(
    item &&
      typeof item === 'object' &&
      'pertanyaan' in item &&
      'pilihan' in item
  );
}

export function parseQuestionBankJson(payload: unknown): Question[] {
  let rawItems: unknown[] = [];

  if (Array.isArray(payload)) {
    rawItems = payload;
  } else if (
    payload &&
    typeof payload === 'object' &&
    'soal' in payload &&
    Array.isArray((payload as RawBankSoalFile).soal)
  ) {
    rawItems = (payload as RawBankSoalFile).soal;
  } else if (
    payload &&
    typeof payload === 'object' &&
    'questions' in payload &&
    Array.isArray((payload as { questions: unknown[] }).questions)
  ) {
    rawItems = (payload as { questions: unknown[] }).questions;
  } else {
    throw new Error(
      'Format JSON tidak dikenali. Gunakan struktur { "soal": [...] } atau array soal.'
    );
  }

  const parsed: Question[] = [];
  const seenIds = new Set<string>();

  rawItems.forEach((raw, idx) => {
    if (isNestedQuestion(raw)) {
      const kategori = normalizeCategory(raw.kategori);
      const { id: baseId, numericId } = buildStableQuestionId(kategori, raw.id, idx);
      let id = baseId;
      if (seenIds.has(id)) {
        id = `${baseId}-${idx + 1}`;
      }
      seenIds.add(id);

      const kunci = normalizeOptionKey(raw.kunci_jawaban);
      const pilihan: Record<OptionKey, string> = {
        A: cleanDisplayText(raw.pilihan?.A) || '-',
        B: cleanDisplayText(raw.pilihan?.B) || '-',
        C: cleanDisplayText(raw.pilihan?.C) || '-',
        D: cleanDisplayText(raw.pilihan?.D) || '-',
        E: cleanDisplayText(raw.pilihan?.E) || '-',
      };

      const bobotNilai: Record<OptionKey, number> = {
        A: typeof raw.bobot_nilai?.A === 'number' ? raw.bobot_nilai.A : kunci === 'A' ? 5 : 0,
        B: typeof raw.bobot_nilai?.B === 'number' ? raw.bobot_nilai.B : kunci === 'B' ? 5 : 0,
        C: typeof raw.bobot_nilai?.C === 'number' ? raw.bobot_nilai.C : kunci === 'C' ? 5 : 0,
        D: typeof raw.bobot_nilai?.D === 'number' ? raw.bobot_nilai.D : kunci === 'D' ? 5 : 0,
        E: typeof raw.bobot_nilai?.E === 'number' ? raw.bobot_nilai.E : kunci === 'E' ? 5 : 0,
      };

      parsed.push({
        id,
        numericId,
        kategori,
        subtes: (raw.subtes || kategori).trim(),
        isHots: Boolean(raw.is_hots),
        sumber: (raw.sumber || 'Bank Soal Lokal').trim(),
        wacana: raw.wacana ? cleanDisplayText(raw.wacana) : null,
        pertanyaan: cleanDisplayText(raw.pertanyaan),
        pilihan,
        bobotNilai,
        kunciJawaban: kunci,
        pembahasan:
          cleanDisplayText(raw.pembahasan) ||
          'Belum ada pembahasan tertulis untuk soal ini.',
      });
    } else if (isFlatQuestion(raw)) {
      const kategori = normalizeCategory(raw.category);
      const { id: baseId, numericId } = buildStableQuestionId(kategori, raw.id, idx);
      let id = baseId;
      if (seenIds.has(id)) {
        id = `${baseId}-${idx + 1}`;
      }
      seenIds.add(id);

      const kunci = normalizeOptionKey(raw.correctAnswer);
      const pilihan: Record<OptionKey, string> = {
        A: cleanDisplayText(raw.optionA) || '-',
        B: cleanDisplayText(raw.optionB) || '-',
        C: cleanDisplayText(raw.optionC) || '-',
        D: cleanDisplayText(raw.optionD) || '-',
        E: cleanDisplayText(raw.optionE) || '-',
      };

      const bobotNilai: Record<OptionKey, number> = {
        A: typeof raw.scoreA === 'number' ? raw.scoreA : kunci === 'A' ? 5 : 0,
        B: typeof raw.scoreB === 'number' ? raw.scoreB : kunci === 'B' ? 5 : 0,
        C: typeof raw.scoreC === 'number' ? raw.scoreC : kunci === 'C' ? 5 : 0,
        D: typeof raw.scoreD === 'number' ? raw.scoreD : kunci === 'D' ? 5 : 0,
        E: typeof raw.scoreE === 'number' ? raw.scoreE : kunci === 'E' ? 5 : 0,
      };

      parsed.push({
        id,
        numericId,
        kategori,
        subtes: (raw.subCategory || kategori).trim(),
        isHots: Boolean(raw.isHots),
        sumber: (raw.sumber || 'Paket Impor Pengguna').trim(),
        wacana: raw.wacana ? cleanDisplayText(raw.wacana) : null,
        pertanyaan: cleanDisplayText(raw.question),
        pilihan,
        bobotNilai,
        kunciJawaban: kunci,
        pembahasan:
          cleanDisplayText(raw.explanation) ||
          'Belum ada pembahasan tertulis untuk soal ini.',
      });
    }
  });

  if (parsed.length === 0) {
    throw new Error('File JSON tidak mengandung soal yang valid.');
  }

  return parsed;
}

export function shuffleArray<T>(
  items: readonly T[],
  rng: () => number = Math.random
): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function selectExamQuestions(
  allQuestions: readonly Question[],
  mode: ExamMode,
  rng: () => number = Math.random
): Question[] {
  if (mode === 'ARCADE') {
    return shuffleArray(allQuestions, rng).slice(0, ARCADE_QUESTION_COUNT);
  }
  if (mode === 'DRILL') {
    return shuffleArray(allQuestions, rng).slice(0, DEFAULT_DRILL_COUNT);
  }

  const twk = shuffleArray(
    allQuestions.filter((q) => q.kategori === 'TWK'),
    rng
  ).slice(0, CAT_BKN_QUOTAS.TWK);

  const tiu = shuffleArray(
    allQuestions.filter((q) => q.kategori === 'TIU'),
    rng
  ).slice(0, CAT_BKN_QUOTAS.TIU);

  const tkp = shuffleArray(
    allQuestions.filter((q) => q.kategori === 'TKP'),
    rng
  ).slice(0, CAT_BKN_QUOTAS.TKP);

  return [...twk, ...tiu, ...tkp];
}

export function selectDrillQuestions(
  allQuestions: readonly Question[],
  config: DrillConfig,
  rng: () => number = Math.random
): Question[] {
  const desiredCount = config.count ?? DEFAULT_DRILL_COUNT;
  let pool = allQuestions.filter((q) => {
    if (config.category && q.kategori !== config.category) return false;
    if (config.hotsOnly && !q.isHots) return false;
    if (config.subtes && q.subtes.toLowerCase() !== config.subtes.toLowerCase()) {
      return false;
    }
    return true;
  });

  if (config.keywords && config.keywords.length > 0 && !config.subtes) {
    const kwMatched = pool.filter((q) => {
      const text = `${q.subtes} ${q.pertanyaan}`.toLowerCase();
      return config.keywords!.some((kw) => text.includes(kw.toLowerCase()));
    });
    if (kwMatched.length >= Math.min(4, desiredCount)) {
      pool = kwMatched;
    }
  }

  if (pool.length === 0 && config.category) {
    pool = allQuestions.filter((q) => q.kategori === config.category);
  }
  if (pool.length === 0) {
    pool = [...allQuestions];
  }

  return shuffleArray(pool, rng).slice(0, desiredCount);
}

export function countByCategory(questions: readonly Question[]): CategoryCounts {
  let TWK = 0;
  let TIU = 0;
  let TKP = 0;
  for (const q of questions) {
    if (q.kategori === 'TWK') TWK++;
    else if (q.kategori === 'TIU') TIU++;
    else if (q.kategori === 'TKP') TKP++;
  }
  return {
    TWK,
    TIU,
    TKP,
    total: TWK + TIU + TKP,
  };
}

export function getQuestionAnswerScore(
  question: Question,
  selected: OptionKey | undefined
): number {
  if (!selected) return 0;
  if (question.kategori === 'TKP') {
    const weight = question.bobotNilai[selected];
    if (typeof weight === 'number' && weight > 0) return weight;
    return selected === question.kunciJawaban ? 5 : 1;
  }
  const weight = question.bobotNilai[selected];
  if (typeof weight === 'number') return weight;
  return selected === question.kunciJawaban ? 5 : 0;
}

export function isQuestionBestAnswer(
  question: Question,
  selected: OptionKey | undefined
): boolean {
  if (!selected) return false;
  if (question.kategori === 'TKP') {
    return getQuestionAnswerScore(question, selected) === 5;
  }
  return selected === question.kunciJawaban;
}

function buildCategoryScore(
  questions: readonly Question[],
  answers: Record<string, OptionKey>,
  passingGrade: number
): CategoryScore {
  let score = 0;
  let correctCount = 0;
  for (const q of questions) {
    const chosen = answers[q.id];
    const pts = getQuestionAnswerScore(q, chosen);
    score += pts;
    if (isQuestionBestAnswer(q, chosen)) {
      correctCount++;
    }
  }
  const maxScore = questions.length * 5;
  return {
    score,
    maxScore,
    passingGrade,
    passed: score >= passingGrade,
    correctCount,
    totalCount: questions.length,
  };
}

export function updateQuestionAttemptStats(
  prevMap: QuestionAttemptMap,
  questions: readonly Question[],
  answers: Record<string, OptionKey>
): QuestionAttemptMap {
  const next: QuestionAttemptMap = { ...prevMap };
  for (const q of questions) {
    const chosen = answers[q.id];
    if (!chosen) continue;
    const score = getQuestionAnswerScore(q, chosen);
    const isBest = isQuestionBestAnswer(q, chosen);
    const prev = next[q.id] || {
      attempts: 0,
      bestCount: 0,
      earnedScore: 0,
      maxScore: 0,
    };
    next[q.id] = {
      attempts: prev.attempts + 1,
      bestCount: prev.bestCount + (isBest ? 1 : 0),
      earnedScore: prev.earnedScore + score,
      maxScore: prev.maxScore + 5,
    };
  }
  return next;
}

export function computeSubtestDistribution(
  questions: readonly Question[],
  attemptStats: QuestionAttemptMap = {}
): SubtestAnalysisItem[] {
  const groups = new Map<
    string,
    {
      kategori: QuestionCategory;
      subtes: string;
      totalQuestions: number;
      hotsCount: number;
      wacanaCount: number;
      attemptedQuestions: number;
      totalAttempts: number;
      earnedScore: number;
      maxScore: number;
    }
  >();

  for (const q of questions) {
    const key = `${q.kategori}::${q.subtes}`;
    let entry = groups.get(key);
    if (!entry) {
      entry = {
        kategori: q.kategori,
        subtes: q.subtes,
        totalQuestions: 0,
        hotsCount: 0,
        wacanaCount: 0,
        attemptedQuestions: 0,
        totalAttempts: 0,
        earnedScore: 0,
        maxScore: 0,
      };
      groups.set(key, entry);
    }
    entry.totalQuestions += 1;
    if (q.isHots) entry.hotsCount += 1;
    if (q.wacana) entry.wacanaCount += 1;

    const stat = attemptStats[q.id];
    if (stat && stat.attempts > 0) {
      entry.attemptedQuestions += 1;
      entry.totalAttempts += stat.attempts;
      entry.earnedScore += stat.earnedScore;
      entry.maxScore += stat.maxScore;
    }
  }

  return Array.from(groups.values())
    .map((item) => ({
      kategori: item.kategori,
      subtes: item.subtes,
      totalQuestions: item.totalQuestions,
      hotsCount: item.hotsCount,
      wacanaCount: item.wacanaCount,
      attemptedQuestions: item.attemptedQuestions,
      totalAttempts: item.totalAttempts,
      accuracyPercent:
        item.maxScore > 0
          ? Math.round((item.earnedScore / item.maxScore) * 100)
          : null,
    }))
    .sort(
      (a, b) =>
        a.kategori.localeCompare(b.kategori) || b.totalQuestions - a.totalQuestions
    );
}

export function computeCategoryMastery(
  questions: readonly Question[],
  attemptStats: QuestionAttemptMap
): Record<QuestionCategory, { attempted: number; accuracyPercent: number | null }> {
  const acc: Record<
    QuestionCategory,
    { attempted: number; earned: number; max: number }
  > = {
    TWK: { attempted: 0, earned: 0, max: 0 },
    TIU: { attempted: 0, earned: 0, max: 0 },
    TKP: { attempted: 0, earned: 0, max: 0 },
  };

  for (const q of questions) {
    const stat = attemptStats[q.id];
    if (stat && stat.attempts > 0) {
      acc[q.kategori].attempted += 1;
      acc[q.kategori].earned += stat.earnedScore;
      acc[q.kategori].max += stat.maxScore;
    }
  }

  return {
    TWK: {
      attempted: acc.TWK.attempted,
      accuracyPercent:
        acc.TWK.max > 0 ? Math.round((acc.TWK.earned / acc.TWK.max) * 100) : null,
    },
    TIU: {
      attempted: acc.TIU.attempted,
      accuracyPercent:
        acc.TIU.max > 0 ? Math.round((acc.TIU.earned / acc.TIU.max) * 100) : null,
    },
    TKP: {
      attempted: acc.TKP.attempted,
      accuracyPercent:
        acc.TKP.max > 0 ? Math.round((acc.TKP.earned / acc.TKP.max) * 100) : null,
    },
  };
}

export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface DailyXpPoint {
  dateKey: string;
  shortDay: string;
  fullDateLabel: string;
  xp: number;
  sessions: number;
  isToday: boolean;
}

const ID_SHORT_DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'] as const;
const ID_SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
] as const;

export function computeLast7DaysXpProgress(
  history: readonly ExamHistory[],
  now: Date = new Date()
): DailyXpPoint[] {
  const xpByDate = new Map<string, { xp: number; sessions: number }>();

  for (const item of history) {
    const key = getLocalDateString(new Date(item.timestamp));
    const current = xpByDate.get(key) ?? { xp: 0, sessions: 0 };
    current.xp += Math.max(0, item.xpEarned);
    current.sessions += 1;
    xpByDate.set(key, current);
  }

  const points: DailyXpPoint[] = [];
  const baseDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (let daysAgo = 6; daysAgo >= 0; daysAgo -= 1) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() - daysAgo);
    const dateKey = getLocalDateString(d);
    const isToday = daysAgo === 0;
    const dayName = ID_SHORT_DAYS[d.getDay()];
    const monthName = ID_SHORT_MONTHS[d.getMonth()];
    const stat = xpByDate.get(dateKey) ?? { xp: 0, sessions: 0 };

    points.push({
      dateKey,
      shortDay: isToday ? 'Hari Ini' : dayName,
      fullDateLabel: `${isToday ? 'Hari Ini · ' : `${dayName}, `}${d.getDate()} ${monthName}`,
      xp: stat.xp,
      sessions: stat.sessions,
      isToday,
    });
  }

  return points;
}

export function computeNextStreak(
  currentStreak: number,
  lastPracticeDate: string | null,
  todayStr: string = getLocalDateString()
): { currentStreak: number; lastPracticeDate: string } {
  if (!lastPracticeDate) {
    return { currentStreak: 1, lastPracticeDate: todayStr };
  }
  if (lastPracticeDate === todayStr) {
    return { currentStreak: Math.max(1, currentStreak), lastPracticeDate: todayStr };
  }
  const lastDate = new Date(`${lastPracticeDate}T00:00:00`);
  const todayDate = new Date(`${todayStr}T00:00:00`);
  const diffDays = Math.round(
    (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays === 1) {
    return { currentStreak: currentStreak + 1, lastPracticeDate: todayStr };
  }
  return { currentStreak: 1, lastPracticeDate: todayStr };
}

export function calculateLevelFromXp(totalXp: number): number {
  return Math.floor(Math.max(0, totalXp) / XP_PER_LEVEL) + 1;
}

export function calculateXpProgress(totalXp: number): {
  level: number;
  currentLevelXp: number;
  neededForNextLevel: number;
  percent: number;
} {
  const safeXp = Math.max(0, totalXp);
  const level = calculateLevelFromXp(safeXp);
  const currentLevelXp = safeXp % XP_PER_LEVEL;
  return {
    level,
    currentLevelXp,
    neededForNextLevel: XP_PER_LEVEL,
    percent: Math.round((currentLevelXp / XP_PER_LEVEL) * 100),
  };
}

export function easeOutCubic(t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - clamped, 3);
}

export function interpolateXpValue(
  fromXp: number,
  toXp: number,
  rawProgress: number
): number {
  if (rawProgress <= 0) return fromXp;
  if (rawProgress >= 1) return toXp;
  const eased = easeOutCubic(rawProgress);
  return Math.round(fromXp + (toXp - fromXp) * eased);
}

export function evaluateExamSubmission(params: {
  session: ActiveExamSession;
  questions: readonly Question[];
  prevStats: UserStats;
  now?: Date;
}): {
  result: ExamResult;
  nextStats: UserStats;
} {
  const { session, questions, prevStats, now = new Date() } = params;
  const twkQuestions = questions.filter((q) => q.kategori === 'TWK');
  const tiuQuestions = questions.filter((q) => q.kategori === 'TIU');
  const tkpQuestions = questions.filter((q) => q.kategori === 'TKP');

  const twk = buildCategoryScore(twkQuestions, session.answers, PASSING_GRADES.TWK);
  const tiu = buildCategoryScore(tiuQuestions, session.answers, PASSING_GRADES.TIU);
  const tkp = buildCategoryScore(tkpQuestions, session.answers, PASSING_GRADES.TKP);

  const totalScore = twk.score + tiu.score + tkp.score;
  const passedAll =
    session.mode === 'CAT_BKN'
      ? twk.passed && tiu.passed && tkp.passed
      : totalScore >= Math.round(questions.length * 3.5);

  const answeredCount = questions.filter((q) => Boolean(session.answers[q.id])).length;

  let xpEarned = answeredCount * 3;
  xpEarned += Math.round(totalScore / 5);
  if (session.mode === 'CAT_BKN' && passedAll) {
    xpEarned += 150;
  }
  if (session.mode === 'ARCADE') {
    xpEarned += session.arcadeBonusXp;
  }
  xpEarned = Math.max(10, xpEarned);

  const existingSet = new Set<BadgeId>(prevStats.unlockedBadges);
  const newlyUnlockedBadges: BadgeId[] = [];

  const maybeUnlock = (badge: BadgeId, condition: boolean) => {
    if (condition && !existingSet.has(badge)) {
      existingSet.add(badge);
      newlyUnlockedBadges.push(badge);
    }
  };

  maybeUnlock('Lulus PG Pertama', session.mode === 'CAT_BKN' && passedAll);
  maybeUnlock('Master TWK', twk.score >= 110);
  maybeUnlock(
    'Kilat TIU',
    tiu.score >= 120 || (session.mode === 'ARCADE' && session.arcadeMaxCombo >= 5)
  );
  maybeUnlock('Bijak TKP', tkp.score >= 190);

  const todayStr = getLocalDateString(now);
  const nextStreak = computeNextStreak(
    prevStats.currentStreak,
    prevStats.lastPracticeDate,
    todayStr
  );

  const nextTotalXp = prevStats.totalXp + xpEarned;
  const nextStats: UserStats = {
    totalXp: nextTotalXp,
    level: calculateLevelFromXp(nextTotalXp),
    currentStreak: nextStreak.currentStreak,
    lastPracticeDate: nextStreak.lastPracticeDate,
    unlockedBadges: Array.from(existingSet),
  };

  const durationUsedSeconds = Math.max(
    0,
    session.totalSeconds - session.remainingSeconds
  );

  const history: ExamHistory = {
    id: `HIST-${now.getTime()}`,
    mode: session.mode,
    drillLabel: session.drillLabel,
    timestamp: now.getTime(),
    durationUsedSeconds,
    twkScore: twk.score,
    tiuScore: tiu.score,
    tkpScore: tkp.score,
    totalScore,
    passedAll,
    xpEarned,
    maxCombo: session.arcadeMaxCombo,
    totalQuestions: questions.length,
    answeredCount,
  };

  return {
    result: {
      history,
      questions: [...questions],
      answers: { ...session.answers },
      doubtfulIds: [...session.doubtfulIds],
      twk,
      tiu,
      tkp,
      passedAll,
      xpEarned,
      newlyUnlockedBadges,
      maxCombo: session.arcadeMaxCombo,
    },
    nextStats,
  };
}

export function applyAnswerToSession(
  session: ActiveExamSession,
  question: Question,
  option: OptionKey
): {
  nextSession: ActiveExamSession;
  comboDelta: { combo: number; bonusXpAwarded: number } | null;
} {
  const nextAnswers: Record<string, OptionKey> = {
    ...session.answers,
    [question.id]: option,
  };

  let arcadeCombo = session.arcadeCombo;
  let arcadeMaxCombo = session.arcadeMaxCombo;
  let arcadeBonusXp = session.arcadeBonusXp;
  let lastAnsweredQuestionId = session.lastAnsweredQuestionId;
  let comboDelta: { combo: number; bonusXpAwarded: number } | null = null;

  if (session.mode === 'ARCADE' && lastAnsweredQuestionId !== question.id) {
    lastAnsweredQuestionId = question.id;
    const isBest = isQuestionBestAnswer(question, option);
    if (isBest) {
      arcadeCombo += 1;
      arcadeMaxCombo = Math.max(arcadeMaxCombo, arcadeCombo);
      const bonus = arcadeCombo >= 2 ? arcadeCombo * 5 : 5;
      arcadeBonusXp += bonus;
      comboDelta = { combo: arcadeCombo, bonusXpAwarded: bonus };
    } else {
      arcadeCombo = 0;
      comboDelta = { combo: 0, bonusXpAwarded: 0 };
    }
  }

  return {
    nextSession: {
      ...session,
      answers: nextAnswers,
      arcadeCombo,
      arcadeMaxCombo,
      arcadeBonusXp,
      lastAnsweredQuestionId,
    },
    comboDelta,
  };
}

export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
      2,
      '0'
    )}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(
    2,
    '0'
  )}`;
}

export function getSortedOptionEntries(
  question: Question
): Array<{ key: OptionKey; text: string; score: number }> {
  return OPTION_KEYS.map((key) => ({
    key,
    text: question.pilihan[key],
    score: question.bobotNilai[key],
  }));
}
