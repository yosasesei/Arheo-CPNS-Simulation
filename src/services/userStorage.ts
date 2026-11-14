import type {
  ActiveExamSession,
  ExamHistory,
  QuestionAttemptMap,
  UserStats,
} from '../types/exam';

const KEYS = {
  STATS: 'cat_cpns_user_stats_v1',
  HISTORY: 'cat_cpns_exam_history_v1',
  ACTIVE_SESSION: 'cat_cpns_active_session_v1',
  MUTED: 'cat_cpns_sound_muted_v1',
  QUESTION_ATTEMPTS: 'cat_cpns_question_attempts_v1',
  KISI_CHECKED: 'cat_cpns_kisi_checked_v1',
} as const;

const DEFAULT_STATS: UserStats = {
  totalXp: 0,
  level: 1,
  currentStreak: 0,
  lastPracticeDate: null,
  unlockedBadges: [],
};

export function loadUserStats(): UserStats {
  try {
    const raw = localStorage.getItem(KEYS.STATS);
    if (!raw) return { ...DEFAULT_STATS };
    const parsed = JSON.parse(raw) as Partial<UserStats>;
    return {
      totalXp: typeof parsed.totalXp === 'number' ? parsed.totalXp : 0,
      level: typeof parsed.level === 'number' ? Math.max(1, parsed.level) : 1,
      currentStreak:
        typeof parsed.currentStreak === 'number' ? parsed.currentStreak : 0,
      lastPracticeDate:
        typeof parsed.lastPracticeDate === 'string'
          ? parsed.lastPracticeDate
          : null,
      unlockedBadges: Array.isArray(parsed.unlockedBadges)
        ? parsed.unlockedBadges
        : [],
    };
  } catch {
    return { ...DEFAULT_STATS };
  }
}

export function saveUserStats(stats: UserStats): void {
  try {
    localStorage.setItem(KEYS.STATS, JSON.stringify(stats));
  } catch {
    // Ignore storage quota errors safely
  }
}

export function loadExamHistory(): ExamHistory[] {
  try {
    const raw = localStorage.getItem(KEYS.HISTORY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ExamHistory[]) : [];
  } catch {
    return [];
  }
}

export function saveExamHistory(history: ExamHistory[]): void {
  try {
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(history.slice(0, 30)));
  } catch {
    // Ignore storage quota errors safely
  }
}

export function loadActiveSession(): ActiveExamSession | null {
  try {
    const raw = localStorage.getItem(KEYS.ACTIVE_SESSION);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ActiveExamSession>;
    if (
      !parsed ||
      !Array.isArray(parsed.questionIds) ||
      parsed.questionIds.length === 0
    ) {
      return null;
    }
    const mode =
      parsed.mode === 'ARCADE'
        ? 'ARCADE'
        : parsed.mode === 'DRILL'
        ? 'DRILL'
        : 'CAT_BKN';
    return {
      sessionId: parsed.sessionId || `SES-${Date.now()}`,
      mode,
      drillLabel:
        typeof parsed.drillLabel === 'string' ? parsed.drillLabel : undefined,
      questionIds: parsed.questionIds,
      currentIndex:
        typeof parsed.currentIndex === 'number'
          ? Math.min(Math.max(0, parsed.currentIndex), parsed.questionIds.length - 1)
          : 0,
      answers: parsed.answers && typeof parsed.answers === 'object' ? parsed.answers : {},
      doubtfulIds: Array.isArray(parsed.doubtfulIds) ? parsed.doubtfulIds : [],
      remainingSeconds:
        typeof parsed.remainingSeconds === 'number'
          ? Math.max(0, parsed.remainingSeconds)
          : 6000,
      totalSeconds:
        typeof parsed.totalSeconds === 'number' ? parsed.totalSeconds : 6000,
      arcadeCombo: typeof parsed.arcadeCombo === 'number' ? parsed.arcadeCombo : 0,
      arcadeMaxCombo:
        typeof parsed.arcadeMaxCombo === 'number' ? parsed.arcadeMaxCombo : 0,
      arcadeBonusXp:
        typeof parsed.arcadeBonusXp === 'number' ? parsed.arcadeBonusXp : 0,
      lastAnsweredQuestionId:
        typeof parsed.lastAnsweredQuestionId === 'string'
          ? parsed.lastAnsweredQuestionId
          : null,
      startedAt: typeof parsed.startedAt === 'number' ? parsed.startedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

export function saveActiveSession(session: ActiveExamSession | null): void {
  try {
    if (!session) {
      localStorage.removeItem(KEYS.ACTIVE_SESSION);
      return;
    }
    localStorage.setItem(KEYS.ACTIVE_SESSION, JSON.stringify(session));
  } catch {
    // Ignore storage quota errors safely
  }
}

export function loadSoundMuted(): boolean {
  try {
    return localStorage.getItem(KEYS.MUTED) === 'true';
  } catch {
    return false;
  }
}

export function saveSoundMuted(muted: boolean): void {
  try {
    localStorage.setItem(KEYS.MUTED, String(muted));
  } catch {
    // Ignore storage errors
  }
}

export function loadQuestionAttemptStats(): QuestionAttemptMap {
  try {
    const raw = localStorage.getItem(KEYS.QUESTION_ATTEMPTS);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object'
      ? (parsed as QuestionAttemptMap)
      : {};
  } catch {
    return {};
  }
}

export function saveQuestionAttemptStats(map: QuestionAttemptMap): void {
  try {
    localStorage.setItem(KEYS.QUESTION_ATTEMPTS, JSON.stringify(map));
  } catch {
    // Ignore storage errors
  }
}

export function loadCheckedKisiIds(): string[] {
  try {
    const raw = localStorage.getItem(KEYS.KISI_CHECKED);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export function saveCheckedKisiIds(ids: string[]): void {
  try {
    localStorage.setItem(KEYS.KISI_CHECKED, JSON.stringify(ids));
  } catch {
    // Ignore storage errors
  }
}
