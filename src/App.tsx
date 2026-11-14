import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { AnalisaLayer } from './components/AnalisaLayer';
import { type XpTransitionState } from './components/AnimatedXpCounter';
import { AppShell } from './components/AppShell';
import { DashboardLayer } from './components/DashboardLayer';
import { ExamView } from './components/ExamView';
import { KisiKisiLayer } from './components/KisiKisiLayer';
import { ResultView } from './components/ResultView';
import { SimulasiLayer } from './components/SimulasiLayer';
import {
  ensurePrepopulatedQuestionBank,
  importQuestionPackageFile,
} from './services/questionDb';
import {
  loadActiveSession,
  loadCheckedKisiIds,
  loadExamHistory,
  loadQuestionAttemptStats,
  loadSoundMuted,
  loadUserStats,
  saveActiveSession,
  saveCheckedKisiIds,
  saveExamHistory,
  saveQuestionAttemptStats,
  saveSoundMuted,
  saveUserStats,
} from './services/userStorage';
import type {
  ActiveExamSession,
  CategoryCounts,
  DrillConfig,
  ExamHistory,
  ExamMode,
  ExamResult,
  HomeLayer,
  OptionKey,
  Question,
  QuestionAttemptMap,
  UserStats,
} from './types/exam';
import {
  EXAM_DURATIONS_SECONDS,
  applyAnswerToSession,
  countByCategory,
  evaluateExamSubmission,
  selectDrillQuestions,
  selectExamQuestions,
  updateQuestionAttemptStats,
} from './utils/examEngine';
import { examSound } from './utils/sound';

type ScreenView = 'home' | 'exam' | 'result';

interface NoticeBanner {
  type: 'success' | 'error';
  message: string;
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [bootError, setBootError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [counts, setCounts] = useState<CategoryCounts>({
    TWK: 0,
    TIU: 0,
    TKP: 0,
    total: 0,
  });

  const [stats, setStats] = useState<UserStats>(() => loadUserStats());
  const [history, setHistory] = useState<ExamHistory[]>(() => loadExamHistory());
  const [attemptStats, setAttemptStats] = useState<QuestionAttemptMap>(() =>
    loadQuestionAttemptStats()
  );
  const [checkedKisiIds, setCheckedKisiIds] = useState<string[]>(() =>
    loadCheckedKisiIds()
  );
  const [activeSession, setActiveSession] = useState<ActiveExamSession | null>(
    () => loadActiveSession()
  );
  const [muted, setMuted] = useState<boolean>(() => {
    const initial = loadSoundMuted();
    examSound.setMuted(initial);
    return initial;
  });

  const [screen, setScreen] = useState<ScreenView>('home');
  const [homeLayer, setHomeLayer] = useState<HomeLayer>('dashboard');
  const [lastDrillConfig, setLastDrillConfig] = useState<DrillConfig | null>(
    null
  );
  const [latestResult, setLatestResult] = useState<ExamResult | null>(null);
  const [notice, setNotice] = useState<NoticeBanner | null>(null);
  const [comboBanner, setComboBanner] = useState<{
    combo: number;
    bonusXp: number;
  } | null>(null);
  const [pendingXpTransition, setPendingXpTransition] =
    useState<XpTransitionState | null>(null);

  const warningPlayedRef = useRef(false);
  const submittingRef = useRef(false);

  const showNotice = useCallback(
    (type: NoticeBanner['type'], message: string) => {
      setNotice({ type, message });
    },
    []
  );

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(t);
  }, [notice]);

  // Pre-populate IndexedDB offline on first launch (with brief branded splash)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const minSplash = new Promise((resolve) =>
          window.setTimeout(resolve, 480)
        );
        const [res] = await Promise.all([
          ensurePrepopulatedQuestionBank(),
          minSplash,
        ]);
        if (cancelled) return;
        setAllQuestions(res.questions);
        setCounts(res.counts);
        if (res.seededNow) {
          showNotice(
            'success',
            `${res.counts.total} soal SKD berhasil dimuat ke penyimpanan offline lokal.`
          );
        }
      } catch (err) {
        if (cancelled) return;
        setBootError(
          err instanceof Error
            ? err.message
            : 'Gagal memuat bank soal offline.'
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showNotice]);

  // Persist active session whenever it changes
  useEffect(() => {
    saveActiveSession(activeSession);
  }, [activeSession]);

  const questionMap = useMemo(() => {
    const map = new Map<string, Question>();
    for (const q of allQuestions) {
      map.set(q.id, q);
    }
    return map;
  }, [allQuestions]);

  const sessionQuestions = useMemo(() => {
    if (!activeSession) return [];
    return activeSession.questionIds
      .map((id) => questionMap.get(id))
      .filter((q): q is Question => Boolean(q));
  }, [activeSession, questionMap]);

  const submitCurrentExam = useCallback(
    (sessionSnapshot?: ActiveExamSession) => {
      const targetSession = sessionSnapshot || activeSession;
      if (!targetSession || submittingRef.current) return;
      submittingRef.current = true;

      const questionsForSession = targetSession.questionIds
        .map((id) => questionMap.get(id))
        .filter((q): q is Question => Boolean(q));

      const { result, nextStats } = evaluateExamSubmission({
        session: targetSession,
        questions: questionsForSession,
        prevStats: stats,
      });

      const nextHistory = [result.history, ...history].slice(0, 30);
      const nextAttemptStats = updateQuestionAttemptStats(
        attemptStats,
        questionsForSession,
        targetSession.answers
      );

      setStats(nextStats);
      setHistory(nextHistory);
      setAttemptStats(nextAttemptStats);
      saveUserStats(nextStats);
      saveExamHistory(nextHistory);
      saveQuestionAttemptStats(nextAttemptStats);

      if (nextStats.totalXp > stats.totalXp) {
        setPendingXpTransition({
          id: Date.now(),
          fromXp: stats.totalXp,
          toXp: nextStats.totalXp,
          gainedXp: result.xpEarned,
        });
      }

      setActiveSession(null);
      saveActiveSession(null);
      setComboBanner(null);
      setLatestResult(result);
      setScreen('result');
      submittingRef.current = false;
    },
    [activeSession, questionMap, stats, history, attemptStats]
  );

  // Countdown timer when on active exam screen
  useEffect(() => {
    if (screen !== 'exam' || !activeSession) return;

    const interval = window.setInterval(() => {
      setActiveSession((prev) => {
        if (!prev) return null;
        const nextRemaining = Math.max(0, prev.remainingSeconds - 1);

        if (
          prev.mode === 'CAT_BKN' &&
          nextRemaining === 299 &&
          !warningPlayedRef.current
        ) {
          warningPlayedRef.current = true;
          examSound.playWarningBeep();
        }

        if (nextRemaining === 0) {
          examSound.playTimeUpAlarm();
          const finishedSession = { ...prev, remainingSeconds: 0 };
          window.setTimeout(() => {
            submitCurrentExam(finishedSession);
          }, 0);
          return finishedSession;
        }

        return { ...prev, remainingSeconds: nextRemaining };
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [screen, activeSession?.sessionId, submitCurrentExam]);

  const handleStartDrill = useCallback(
    (config: DrillConfig) => {
      if (allQuestions.length === 0) return;
      examSound.playClick();
      warningPlayedRef.current = false;
      submittingRef.current = false;
      setLastDrillConfig(config);

      const selected = selectDrillQuestions(allQuestions, config);
      const totalSeconds = EXAM_DURATIONS_SECONDS.DRILL;
      const newSession: ActiveExamSession = {
        sessionId: `SES-${Date.now()}`,
        mode: 'DRILL',
        drillLabel: config.label,
        questionIds: selected.map((q) => q.id),
        currentIndex: 0,
        answers: {},
        doubtfulIds: [],
        remainingSeconds: totalSeconds,
        totalSeconds,
        arcadeCombo: 0,
        arcadeMaxCombo: 0,
        arcadeBonusXp: 0,
        lastAnsweredQuestionId: null,
        startedAt: Date.now(),
      };

      setComboBanner(null);
      setPendingXpTransition(null);
      setActiveSession(newSession);
      setScreen('exam');
    },
    [allQuestions]
  );

  const handleStartExam = useCallback(
    (mode: ExamMode) => {
      if (allQuestions.length === 0) return;
      if (mode === 'DRILL') {
        handleStartDrill(
          lastDrillConfig || { label: 'Latihan Fokus Acak', count: 10 }
        );
        return;
      }

      examSound.playClick();
      warningPlayedRef.current = false;
      submittingRef.current = false;

      const selected = selectExamQuestions(allQuestions, mode);
      const totalSeconds = EXAM_DURATIONS_SECONDS[mode];
      const newSession: ActiveExamSession = {
        sessionId: `SES-${Date.now()}`,
        mode,
        questionIds: selected.map((q) => q.id),
        currentIndex: 0,
        answers: {},
        doubtfulIds: [],
        remainingSeconds: totalSeconds,
        totalSeconds,
        arcadeCombo: 0,
        arcadeMaxCombo: 0,
        arcadeBonusXp: 0,
        lastAnsweredQuestionId: null,
        startedAt: Date.now(),
      };

      setComboBanner(null);
      setPendingXpTransition(null);
      setActiveSession(newSession);
      setScreen('exam');
    },
    [allQuestions, handleStartDrill, lastDrillConfig]
  );

  const handleResumeSession = useCallback(() => {
    if (!activeSession) return;
    examSound.playClick();
    warningPlayedRef.current = activeSession.remainingSeconds < 300;
    submittingRef.current = false;
    setScreen('exam');
  }, [activeSession]);

  const handleDiscardSession = useCallback(() => {
    examSound.playClick();
    setActiveSession(null);
    saveActiveSession(null);
    showNotice('success', 'Sesi ujian aktif dihapus.');
  }, [showNotice]);

  const handleSelectAnswer = useCallback(
    (question: Question, option: OptionKey) => {
      examSound.playClick();
      setActiveSession((prev) => {
        if (!prev) return null;
        const { nextSession, comboDelta } = applyAnswerToSession(
          prev,
          question,
          option
        );
        if (comboDelta) {
          setComboBanner({
            combo: comboDelta.combo,
            bonusXp: comboDelta.bonusXpAwarded,
          });
        }
        return nextSession;
      });
    },
    []
  );

  const handleToggleDoubtful = useCallback((questionId: string) => {
    examSound.playClick();
    setActiveSession((prev) => {
      if (!prev) return null;
      const exists = prev.doubtfulIds.includes(questionId);
      const doubtfulIds = exists
        ? prev.doubtfulIds.filter((id) => id !== questionId)
        : [...prev.doubtfulIds, questionId];
      return { ...prev, doubtfulIds };
    });
  }, []);

  const handleGoToQuestion = useCallback((index: number) => {
    examSound.playClick();
    setActiveSession((prev) => {
      if (!prev) return null;
      const bounded = Math.min(
        Math.max(0, index),
        prev.questionIds.length - 1
      );
      return { ...prev, currentIndex: bounded };
    });
  }, []);

  const handleToggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      examSound.setMuted(next);
      saveSoundMuted(next);
      return next;
    });
  }, []);

  const handleToggleKisiCheck = useCallback((topicId: string) => {
    examSound.playClick();
    setCheckedKisiIds((prev) => {
      const exists = prev.includes(topicId);
      const next = exists
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId];
      saveCheckedKisiIds(next);
      return next;
    });
  }, []);

  const handleImportFile = useCallback(
    async (file: File) => {
      setImporting(true);
      try {
        const res = await importQuestionPackageFile(file);
        setAllQuestions(res.questions);
        setCounts(countByCategory(res.questions));
        showNotice(
          'success',
          `Berhasil mengimpor ${res.importedCount} soal dari ${file.name}. Total bank soal: ${res.counts.total}.`
        );
      } catch (err) {
        showNotice(
          'error',
          err instanceof Error
            ? err.message
            : 'Gagal mengimpor file paket soal.'
        );
      } finally {
        setImporting(false);
      }
    },
    [showNotice]
  );

  if (loading) {
    return (
      <div
        role="status"
        aria-label="Memuat CAT CPNS Master"
        className="artheo-mesh flex min-h-screen flex-col items-center justify-center px-6 text-center text-white"
      >
        <div className="flex flex-col items-center">
          <img
            src="/assets/aistudio/Asset_2_3x_3b1d334d.png"
            alt="Logo Artheo CAT CPNS Master"
            className="h-24 w-auto drop-shadow-lg sm:h-28"
          />
          <div className="mt-6 text-sm font-bold tracking-wide text-white/95">
            CAT CPNS Master
          </div>
          <p className="mt-1 text-xs text-white/80">
            Menyiapkan bank soal SKD ke penyimpanan offline...
          </p>

          <div className="mt-5 h-1.5 w-48 overflow-hidden rounded-full bg-white/20">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-white" />
          </div>
        </div>
      </div>
    );
  }

  if (bootError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF8FA] px-4 text-center">
        <AlertCircle className="h-9 w-9 text-rose-600" />
        <h1 className="mt-3 text-lg font-bold text-[#1C1420]">
          Gagal Memuat Bank Soal
        </h1>
        <p className="mt-1 max-w-md text-sm text-slate-600">{bootError}</p>
      </div>
    );
  }

  return (
    <div data-screen={screen} data-layer={homeLayer}>
      {notice && (
        <div
          role="status"
          className={`fixed top-4 right-4 z-50 flex max-w-sm items-start gap-2.5 rounded-xl border px-4 py-3 text-xs font-semibold shadow-lg ${
            notice.type === 'success'
              ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
              : 'border-rose-300 bg-rose-50 text-rose-900'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
          )}
          <span className="flex-1">{notice.message}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Tutup notifikasi"
            className="text-slate-500 hover:text-slate-800"
          >
            ×
          </button>
        </div>
      )}

      {screen === 'home' && (
        <AppShell
          activeLayer={homeLayer}
          onChangeLayer={(layer) => {
            examSound.playClick();
            setHomeLayer(layer);
          }}
          stats={stats}
          counts={counts}
          xpTransition={pendingXpTransition}
          onXpTransitionComplete={() => setPendingXpTransition(null)}
        >
          {homeLayer === 'dashboard' && (
            <DashboardLayer
              stats={stats}
              counts={counts}
              history={history}
              allQuestions={allQuestions}
              attemptStats={attemptStats}
              activeSession={activeSession}
              onStartExam={handleStartExam}
              onStartDrill={handleStartDrill}
              onResumeSession={handleResumeSession}
              onDiscardSession={handleDiscardSession}
              onNavigateLayer={(layer) => {
                examSound.playClick();
                setHomeLayer(layer);
              }}
            />
          )}

          {homeLayer === 'simulasi' && (
            <SimulasiLayer
              counts={counts}
              allQuestions={allQuestions}
              history={history}
              importing={importing}
              onStartExam={handleStartExam}
              onStartDrill={handleStartDrill}
              onImportFile={handleImportFile}
            />
          )}

          {homeLayer === 'analisa' && (
            <AnalisaLayer
              allQuestions={allQuestions}
              attemptStats={attemptStats}
              onStartDrill={handleStartDrill}
            />
          )}

          {homeLayer === 'kisi' && (
            <KisiKisiLayer
              allQuestions={allQuestions}
              checkedKisiIds={checkedKisiIds}
              onToggleKisiCheck={handleToggleKisiCheck}
              onStartDrill={handleStartDrill}
            />
          )}
        </AppShell>
      )}

      {screen === 'exam' && activeSession && sessionQuestions.length > 0 && (
        <ExamView
          session={activeSession}
          questions={sessionQuestions}
          muted={muted}
          comboBanner={comboBanner}
          onSelectAnswer={handleSelectAnswer}
          onToggleDoubtful={handleToggleDoubtful}
          onGoToQuestion={handleGoToQuestion}
          onToggleMute={handleToggleMute}
          onSubmitExam={() => submitCurrentExam()}
          onExitToHome={() => {
            examSound.playClick();
            setScreen('home');
          }}
        />
      )}

      {screen === 'result' && latestResult && (
        <ResultView
          result={latestResult}
          onBackHome={() => {
            examSound.playClick();
            setHomeLayer('dashboard');
            setScreen('home');
          }}
          onRetryMode={handleStartExam}
        />
      )}
    </div>
  );
}
