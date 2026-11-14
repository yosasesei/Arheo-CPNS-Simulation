export type QuestionCategory = 'TWK' | 'TIU' | 'TKP';

export type OptionKey = 'A' | 'B' | 'C' | 'D' | 'E';

export type ExamMode = 'CAT_BKN' | 'ARCADE' | 'DRILL';

export type HomeLayer = 'dashboard' | 'simulasi' | 'analisa' | 'kisi';

export interface Question {
  id: string; // e.g. "TWK-001" or "1"
  numericId: number;
  kategori: QuestionCategory;
  subtes: string;
  isHots: boolean;
  sumber: string;
  wacana: string | null;
  pertanyaan: string;
  pilihan: Record<OptionKey, string>;
  bobotNilai: Record<OptionKey, number>;
  kunciJawaban: OptionKey;
  pembahasan: string;
}

export interface RawNestedQuestion {
  id: number | string;
  kategori: string;
  subtes?: string;
  is_hots?: boolean;
  sumber?: string;
  wacana?: string | null;
  pertanyaan: string;
  pilihan: Partial<Record<OptionKey, string>>;
  kunci_jawaban: string;
  bobot_nilai?: Partial<Record<OptionKey, number>>;
  pembahasan?: string;
}

export interface RawBankSoalFile {
  metadata?: {
    versi?: string;
    judul?: string;
    total_soal?: number;
  };
  soal: RawNestedQuestion[];
}

export interface RawFlatQuestion {
  id: string;
  category: string;
  subCategory?: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string;
  scoreA?: number;
  scoreB?: number;
  scoreC?: number;
  scoreD?: number;
  scoreE?: number;
  correctAnswer: string;
  explanation?: string;
  wacana?: string | null;
  isHots?: boolean;
  sumber?: string;
}

export type BadgeId =
  | 'Lulus PG Pertama'
  | 'Master TWK'
  | 'Kilat TIU'
  | 'Bijak TKP';

export interface UserStats {
  totalXp: number;
  level: number;
  currentStreak: number;
  lastPracticeDate: string | null; // YYYY-MM-DD local date
  unlockedBadges: BadgeId[];
}

export interface CategoryScore {
  score: number;
  maxScore: number;
  passingGrade: number;
  passed: boolean;
  correctCount: number;
  totalCount: number;
}

export interface ExamHistory {
  id: string;
  mode: ExamMode;
  drillLabel?: string;
  timestamp: number;
  durationUsedSeconds: number;
  twkScore: number;
  tiuScore: number;
  tkpScore: number;
  totalScore: number;
  passedAll: boolean;
  xpEarned: number;
  maxCombo: number;
  totalQuestions: number;
  answeredCount: number;
}

export interface ExamResult {
  history: ExamHistory;
  questions: Question[];
  answers: Record<string, OptionKey>;
  doubtfulIds: string[];
  twk: CategoryScore;
  tiu: CategoryScore;
  tkp: CategoryScore;
  passedAll: boolean;
  xpEarned: number;
  newlyUnlockedBadges: BadgeId[];
  maxCombo: number;
}

export interface ActiveExamSession {
  sessionId: string;
  mode: ExamMode;
  drillLabel?: string;
  questionIds: string[];
  currentIndex: number;
  answers: Record<string, OptionKey>;
  doubtfulIds: string[];
  remainingSeconds: number;
  totalSeconds: number;
  arcadeCombo: number;
  arcadeMaxCombo: number;
  arcadeBonusXp: number;
  lastAnsweredQuestionId: string | null;
  startedAt: number;
}

export interface CategoryCounts {
  TWK: number;
  TIU: number;
  TKP: number;
  total: number;
}

export interface QuestionAttemptStat {
  attempts: number;
  bestCount: number;
  earnedScore: number;
  maxScore: number;
}

export type QuestionAttemptMap = Record<string, QuestionAttemptStat>;

export interface SubtestAnalysisItem {
  kategori: QuestionCategory;
  subtes: string;
  totalQuestions: number;
  hotsCount: number;
  wacanaCount: number;
  attemptedQuestions: number;
  totalAttempts: number;
  accuracyPercent: number | null;
}

export interface DrillConfig {
  label: string;
  category?: QuestionCategory;
  subtes?: string;
  keywords?: string[];
  hotsOnly?: boolean;
  count?: number;
}

export interface KisiKisiTopic {
  id: string;
  kategori: QuestionCategory;
  judul: string;
  indikator: string;
  strategi: string;
  targetSubtes: string[];
  keywords: string[];
}
