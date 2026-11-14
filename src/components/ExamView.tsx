import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  Check,
  CheckCircle2,
  Clock,
  Flag,
  Home,
  LayoutGrid,
  Send,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import type {
  ActiveExamSession,
  OptionKey,
  Question,
} from '../types/exam';
import {
  formatCountdown,
  getSortedOptionEntries,
} from '../utils/examEngine';

interface ExamViewProps {
  session: ActiveExamSession;
  questions: Question[];
  muted: boolean;
  comboBanner: { combo: number; bonusXp: number } | null;
  onSelectAnswer: (question: Question, option: OptionKey) => void;
  onToggleDoubtful: (questionId: string) => void;
  onGoToQuestion: (index: number) => void;
  onToggleMute: () => void;
  onSubmitExam: () => void;
  onExitToHome: () => void;
}

export const ExamView: React.FC<ExamViewProps> = ({
  session,
  questions,
  muted,
  comboBanner,
  onSelectAnswer,
  onToggleDoubtful,
  onGoToQuestion,
  onToggleMute,
  onSubmitExam,
  onExitToHome,
}) => {
  const [gridOpen, setGridOpen] = useState(false);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);

  const currentQuestion = questions[session.currentIndex];
  if (!currentQuestion) {
    return null;
  }

  const totalQuestions = questions.length;
  const selectedOption = session.answers[currentQuestion.id];
  const isDoubtful = session.doubtfulIds.includes(currentQuestion.id);
  const isUrgentTimer = session.remainingSeconds < 5 * 60;
  const answeredCount = questions.filter((q) =>
    Boolean(session.answers[q.id])
  ).length;
  const doubtfulCount = session.doubtfulIds.length;
  const unansweredCount = totalQuestions - answeredCount;
  const isLastQuestion = session.currentIndex === totalQuestions - 1;
  const options = getSortedOptionEntries(currentQuestion);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      {/* Top Exam Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onExitToHome}
              title="Simpan progres & kembali ke Beranda"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-100"
              aria-label="Kembali ke Beranda"
            >
              <Home className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-[#9D174D]">
                <span>{currentQuestion.kategori}</span>
                <span className="text-slate-300">·</span>
                <span className="truncate font-semibold text-slate-600">
                  {currentQuestion.subtes}
                </span>
                {currentQuestion.isHots && (
                  <>
                    <span className="text-slate-300">·</span>
                    <span className="font-bold text-amber-700">HOTS</span>
                  </>
                )}
              </div>
              <div className="font-mono text-xs font-semibold text-slate-500 tabular-nums">
                Soal {session.currentIndex + 1} / {totalQuestions}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {session.mode === 'ARCADE' && session.arcadeCombo > 0 && (
              <div className="hidden items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 font-mono text-xs font-bold text-amber-700 tabular-nums sm:inline-flex">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                {session.arcadeCombo}x Combo
              </div>
            )}

            {/* Countdown Timer */}
            <div
              aria-label="Sisa waktu ujian"
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-mono text-sm font-bold tabular-nums ${
                isUrgentTimer
                  ? 'timer-urgent border-red-300 bg-red-50 text-red-700'
                  : 'border-slate-200 bg-slate-50 text-slate-900'
              }`}
            >
              <Clock
                className={`h-4 w-4 ${
                  isUrgentTimer ? 'text-red-600' : 'text-slate-600'
                }`}
              />
              <span>{formatCountdown(session.remainingSeconds)}</span>
            </div>

            {/* Sound Mute Toggle */}
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={muted ? 'Nyalakan suara' : 'Bisukan suara'}
              title={muted ? 'Suara Nonaktif' : 'Suara Aktif'}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-100"
            >
              {muted ? (
                <VolumeX className="h-4 w-4 text-slate-400" />
              ) : (
                <Volume2 className="h-4 w-4 text-slate-700" />
              )}
            </button>

            {/* Grid Navigator Drawer Trigger */}
            <button
              type="button"
              onClick={() => setGridOpen(true)}
              aria-label="Daftar Soal"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-100"
            >
              <LayoutGrid className="h-4 w-4 text-[#9D174D]" />
              <span className="hidden sm:inline">Daftar Soal</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Question Stage */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {comboBanner && session.mode === 'ARCADE' && (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-800">
            <span className="inline-flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-amber-600" />
              {comboBanner.combo > 0
                ? `Combo ${comboBanner.combo}x! Jawaban tepat.`
                : 'Combo terputus — fokus ke soal berikutnya.'}
            </span>
            {comboBanner.bonusXp > 0 && (
              <span className="font-mono font-bold tabular-nums">
                +{comboBanner.bonusXp} Bonus XP
              </span>
            )}
          </div>
        )}

        <div
          className={`grid gap-6 ${
            currentQuestion.wacana ? 'lg:grid-cols-12' : ''
          }`}
        >
          {/* Reading Passage Column (if wacana exists) */}
          {currentQuestion.wacana && (
            <section
              aria-label="Wacana Bacaan"
              className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-5 lg:max-h-[70vh] lg:overflow-y-auto"
            >
              <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-2.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                <BookOpenText className="h-4 w-4 text-blue-600" />
                <span>Wacana Bacaan</span>
              </div>
              <div className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                {currentQuestion.wacana}
              </div>
            </section>
          )}

          {/* Question & Options Column */}
          <section
            aria-label="Area Pertanyaan"
            className={`space-y-5 ${
              currentQuestion.wacana ? 'lg:col-span-7' : 'mx-auto w-full max-w-3xl'
            }`}
          >
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span className="font-mono font-semibold text-slate-700 tabular-nums">
                  Nomor {session.currentIndex + 1} · {currentQuestion.id}
                </span>
                {isDoubtful && (
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                    <Flag className="h-3.5 w-3.5" />
                    Ditandai Ragu-ragu
                  </span>
                )}
              </div>

              <div className="whitespace-pre-line text-base font-medium leading-relaxed text-slate-900 sm:text-[17px]">
                {currentQuestion.pertanyaan}
              </div>

              {currentQuestion.sumber && (
                <p className="mt-3 text-[11px] text-slate-400">
                  Sumber: {currentQuestion.sumber}
                </p>
              )}
            </div>

            {/* Option Cards A-E */}
            <div
              role="radiogroup"
              aria-label="Pilihan Jawaban"
              className="space-y-2.5"
            >
              {options.map((opt) => {
                const isSelected = selectedOption === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => onSelectAnswer(currentQuestion, opt.key)}
                    className={`group flex w-full items-start gap-3.5 rounded-xl border p-4 text-left transition ${
                      isSelected
                        ? 'border-[#9D174D] bg-rose-50/70 ring-1 ring-[#9D174D]'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold transition ${
                        isSelected
                          ? 'bg-[#831843] text-white'
                          : 'bg-slate-100 text-slate-700 group-hover:bg-slate-200'
                      }`}
                    >
                      {opt.key}
                    </span>
                    <span className="flex-1 whitespace-pre-line text-sm leading-relaxed text-slate-800 sm:text-[15px]">
                      {opt.text}
                    </span>
                    {isSelected && (
                      <Check className="mt-1 h-4 w-4 shrink-0 text-[#9D174D]" />
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      {/* Bottom Action Bar */}
      <footer className="sticky bottom-0 z-30 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
          <button
            type="button"
            disabled={session.currentIndex === 0}
            onClick={() => onGoToQuestion(session.currentIndex - 1)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Sebelumnya</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleDoubtful(currentQuestion.id)}
            aria-pressed={isDoubtful}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
              isDoubtful
                ? 'border-amber-400 bg-amber-100 text-amber-900'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-amber-50'
            }`}
          >
            <Flag
              className={`h-4 w-4 ${
                isDoubtful ? 'text-amber-700' : 'text-slate-500'
              }`}
            />
            <span>Ragu-ragu</span>
          </button>

          <div className="flex items-center gap-2">
            {!isLastQuestion ? (
              <button
                type="button"
                onClick={() => onGoToQuestion(session.currentIndex + 1)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#5B0A2B] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4A051D]"
              >
                <span>Simpan & Lanjut</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmSubmitOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                <Send className="h-4 w-4" />
                <span>Selesai Ujian</span>
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* ModalBottomSheet Grid Navigasi Soal */}
      {gridOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigasi Nomor Soal"
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 sm:items-center sm:p-4"
        >
          <div className="flex max-h-[88vh] w-full max-w-3xl flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Navigasi Nomor Soal ({totalQuestions} Soal)
                </h2>
                <p className="font-mono text-xs text-slate-500 tabular-nums">
                  Dijawab: {answeredCount} · Ragu-ragu: {doubtfulCount} · Kosong:{' '}
                  {unansweredCount}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setGridOpen(false)}
                aria-label="Tutup navigasi soal"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Color Status Legend */}
            <div className="flex flex-wrap items-center gap-4 border-b border-slate-100 bg-slate-50 px-5 py-2.5 text-xs font-medium text-slate-700">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-blue-600" />
                Aktif
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-emerald-600" />
                Sudah Dijawab
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-amber-400" />
                Ragu-ragu
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm border border-slate-300 bg-slate-100" />
                Kosong
              </span>
            </div>

            {/* Grid Numbers */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
                {questions.map((q, idx) => {
                  const isActive = idx === session.currentIndex;
                  const isFlagged = session.doubtfulIds.includes(q.id);
                  const isAnswered = Boolean(session.answers[q.id]);

                  let styleClass =
                    'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200';
                  if (isActive && isFlagged) {
                    styleClass =
                      'border-blue-700 bg-blue-600 text-white ring-2 ring-amber-400';
                  } else if (isActive) {
                    styleClass =
                      'border-blue-700 bg-blue-600 text-white ring-2 ring-blue-200';
                  } else if (isFlagged) {
                    styleClass =
                      'border-amber-400 bg-amber-400 text-slate-950 hover:bg-amber-500';
                  } else if (isAnswered) {
                    styleClass =
                      'border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700';
                  }

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => {
                        onGoToQuestion(idx);
                        setGridOpen(false);
                      }}
                      className={`relative flex h-10 items-center justify-center rounded-lg border font-mono text-xs font-bold tabular-nums transition ${styleClass}`}
                    >
                      {idx + 1}
                      {isActive && isFlagged && (
                        <span
                          aria-hidden="true"
                          className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-amber-300"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-5 py-4">
              <button
                type="button"
                onClick={() => setGridOpen(false)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  setGridOpen(false);
                  setConfirmSubmitOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                <CheckCircle2 className="h-4 w-4" />
                Kumpulkan & Nilai Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {confirmSubmitOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Konfirmasi Pengumpulan Ujian"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Akhiri & Kumpulkan Ujian?
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Pastikan Anda telah memeriksa kembali seluruh jawaban sebelum
                  penilaian akhir.
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-center font-mono text-xs tabular-nums">
              <div>
                <div className="text-slate-500">Dijawab</div>
                <div className="mt-0.5 text-sm font-bold text-emerald-700">
                  {answeredCount}
                </div>
              </div>
              <div>
                <div className="text-slate-500">Ragu-ragu</div>
                <div className="mt-0.5 text-sm font-bold text-amber-700">
                  {doubtfulCount}
                </div>
              </div>
              <div>
                <div className="text-slate-500">Kosong</div>
                <div className="mt-0.5 text-sm font-bold text-slate-900">
                  {unansweredCount}
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmSubmitOpen(false)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Kembali Cek Soal
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmSubmitOpen(false);
                  onSubmitExam();
                }}
                className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                Ya, Nilai Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
