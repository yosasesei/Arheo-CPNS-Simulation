import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Award,
  CheckCircle2,
  Flag,
  RotateCcw,
  Sparkles,
  XCircle,
} from 'lucide-react';
import type { ExamMode, ExamResult, OptionKey } from '../types/exam';
import {
  formatCountdown,
  getQuestionAnswerScore,
  getSortedOptionEntries,
  isQuestionBestAnswer,
} from '../utils/examEngine';

type ReviewFilter = 'ALL' | 'WRONG_OR_LOW' | 'DOUBTFUL';

interface ResultViewProps {
  result: ExamResult;
  onBackHome: () => void;
  onRetryMode: (mode: ExamMode) => void;
}

export const ResultView: React.FC<ResultViewProps> = ({
  result,
  onBackHome,
  onRetryMode,
}) => {
  const [filter, setFilter] = useState<ReviewFilter>('ALL');

  const doubtfulSet = useMemo(
    () => new Set(result.doubtfulIds),
    [result.doubtfulIds]
  );

  const reviewItems = useMemo(() => {
    return result.questions
      .map((q, index) => {
        const chosen = result.answers[q.id];
        const score = getQuestionAnswerScore(q, chosen);
        const isBest = isQuestionBestAnswer(q, chosen);
        const isDoubtful = doubtfulSet.has(q.id);
        return { q, index, chosen, score, isBest, isDoubtful };
      })
      .filter((item) => {
        if (filter === 'WRONG_OR_LOW') {
          return !item.isBest;
        }
        if (filter === 'DOUBTFUL') {
          return item.isDoubtful;
        }
        return true;
      });
  }, [result.questions, result.answers, doubtfulSet, filter]);

  const wrongOrLowCount = useMemo(
    () =>
      result.questions.filter(
        (q) => !isQuestionBestAnswer(q, result.answers[q.id])
      ).length,
    [result.questions, result.answers]
  );

  const categoryCards = [
    { label: 'TWK', sub: 'Tes Wawasan Kebangsaan', data: result.twk },
    { label: 'TIU', sub: 'Tes Intelegensia Umum', data: result.tiu },
    { label: 'TKP', sub: 'Tes Karakteristik Pribadi', data: result.tkp },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={onBackHome}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Beranda
          </button>

          <button
            type="button"
            onClick={() => onRetryMode(result.history.mode)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#5B0A2B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4A051D]"
          >
            <RotateCcw className="h-4 w-4" />
            Ulangi Mode Ini
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        {/* Status Banner */}
        <section
          aria-label="Status Kelulusan"
          className={`rounded-2xl border p-6 sm:p-7 ${
            result.passedAll
              ? 'border-emerald-300 bg-emerald-50/70'
              : 'border-rose-300 bg-rose-50/70'
          }`}
        >
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-4">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                  result.passedAll
                    ? 'bg-emerald-600 text-white'
                    : 'bg-rose-600 text-white'
                }`}
              >
                {result.passedAll ? (
                  <CheckCircle2 className="h-6 w-6" />
                ) : (
                  <AlertCircle className="h-6 w-6" />
                )}
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  {result.history.mode === 'CAT_BKN'
                    ? 'Hasil Simulasi CAT BKN'
                    : result.history.mode === 'ARCADE'
                    ? 'Hasil Arena Tantangan Cepat'
                    : `Hasil Latihan · ${result.history.drillLabel || 'Fokus Subtes'}`}
                </div>
                <h1
                  className={`mt-0.5 text-2xl font-extrabold tracking-tight ${
                    result.passedAll ? 'text-emerald-900' : 'text-rose-900'
                  }`}
                >
                  {result.history.mode === 'CAT_BKN'
                    ? result.passedAll
                      ? 'LULUS AMBANG BATAS'
                      : 'BELUM LULUS AMBANG BATAS'
                    : result.history.mode === 'ARCADE'
                    ? result.passedAll
                      ? 'TARGET ARENA TERCAPAI'
                      : 'TARGET ARENA BELUM TERCAPAI'
                    : result.passedAll
                    ? 'TARGET LATIHAN TERCAPAI'
                    : 'PERLU LATIHAN TAMBAHAN'}
                </h1>
                <p className="mt-1 text-sm text-slate-700">
                  Total Skor:{' '}
                  <strong className="font-mono text-slate-900 tabular-nums">
                    {result.history.totalScore}
                  </strong>{' '}
                  · Durasi:{' '}
                  <span className="font-mono tabular-nums">
                    {formatCountdown(result.history.durationUsedSeconds)}
                  </span>{' '}
                  · Terjawab {result.history.answeredCount}/
                  {result.history.totalQuestions}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-start gap-1.5 rounded-xl border border-white/70 bg-white/80 px-4 py-3 sm:items-end">
              <span className="inline-flex items-center gap-1.5 font-mono text-sm font-bold text-[#9D174D] tabular-nums">
                <Sparkles className="h-4 w-4" />+{result.xpEarned} XP Diperoleh
              </span>
              {result.history.mode === 'ARCADE' && (
                <span className="font-mono text-xs text-slate-600 tabular-nums">
                  Combo Tertinggi: {result.maxCombo}x
                </span>
              )}
            </div>
          </div>

          {result.newlyUnlockedBadges.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-200/70 pt-4 text-xs font-semibold text-emerald-900">
              <Award className="h-4 w-4 text-emerald-700" />
              <span>Lencana Baru Terbuka:</span>
              {result.newlyUnlockedBadges.map((b) => (
                <span key={b} className="font-bold underline decoration-emerald-500">
                  {b}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Score vs Passing Grade Breakdown */}
        <section
          aria-label="Rincian Skor per Kategori"
          className="grid gap-4 sm:grid-cols-3"
        >
          {categoryCards.map(({ label, sub, data }) => {
            const pct =
              data.maxScore > 0
                ? Math.min(100, Math.round((data.score / data.maxScore) * 100))
                : 0;
            const showPg = result.history.mode === 'CAT_BKN';
            return (
              <article
                key={label}
                className="rounded-2xl border border-slate-200 bg-white p-5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{label}</h2>
                    <p className="text-xs text-slate-500">{sub}</p>
                  </div>
                  {showPg && (
                    <span
                      className={`text-xs font-bold ${
                        data.passed ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {data.passed ? '● Memenuhi PG' : '▲ Di Bawah PG'}
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-baseline justify-between font-mono tabular-nums">
                  <span className="text-2xl font-extrabold text-slate-900">
                    {data.score}
                  </span>
                  <span className="text-xs text-slate-500">
                    {showPg
                      ? `PG: ${data.passingGrade} / Maks ${data.maxScore}`
                      : `Maks ${data.maxScore}`}
                  </span>
                </div>

                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${
                      !showPg || data.passed ? 'bg-emerald-600' : 'bg-rose-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <p className="mt-2.5 text-xs text-slate-600">
                  Skor maksimal diraih pada{' '}
                  <strong className="font-mono tabular-nums">
                    {data.correctCount}/{data.totalCount}
                  </strong>{' '}
                  soal
                </p>
              </article>
            );
          })}
        </section>

        {/* Pembahasan & Filter Tabs */}
        <section
          aria-label="Pembahasan Soal"
          className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
        >
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Pembahasan & Kunci Jawaban
              </h2>
              <p className="text-xs text-slate-500">
                Menampilkan kunci jawaban, bobot nilai 1–5 untuk TKP, dan
                penjelasan lengkap.
              </p>
            </div>

            <div
              role="tablist"
              aria-label="Filter Pembahasan"
              className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs font-semibold"
            >
              <button
                type="button"
                role="tab"
                aria-selected={filter === 'ALL'}
                onClick={() => setFilter('ALL')}
                className={`rounded-lg px-3 py-1.5 transition ${
                  filter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua Soal ({result.questions.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={filter === 'WRONG_OR_LOW'}
                onClick={() => setFilter('WRONG_OR_LOW')}
                className={`rounded-lg px-3 py-1.5 transition ${
                  filter === 'WRONG_OR_LOW'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Salah / Skor Rendah ({wrongOrLowCount})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={filter === 'DOUBTFUL'}
                onClick={() => setFilter('DOUBTFUL')}
                className={`rounded-lg px-3 py-1.5 transition ${
                  filter === 'DOUBTFUL'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ragu-ragu ({result.doubtfulIds.length})
              </button>
            </div>
          </div>

          {reviewItems.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">
              Tidak ada soal pada kategori filter ini.
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {reviewItems.map(({ q, index, chosen, score, isBest, isDoubtful }) => {
                const options = getSortedOptionEntries(q);
                return (
                  <article key={q.id} className="py-6 first:pt-5 last:pb-2">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-mono font-bold text-slate-900 tabular-nums">
                          No. {index + 1}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="font-bold text-[#9D174D]">
                          {q.kategori}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-600">{q.subtes}</span>
                        {isDoubtful && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                              <Flag className="h-3 w-3" />
                              Ragu-ragu
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 font-mono text-xs font-bold tabular-nums">
                        {isBest ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Skor +{score}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-700">
                            <XCircle className="h-3.5 w-3.5" />
                            {chosen ? `Skor +${score}` : 'Tidak Dijawab (0)'}
                          </span>
                        )}
                      </div>
                    </div>

                    {q.wacana && (
                      <details className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                        <summary className="cursor-pointer font-semibold text-slate-800">
                          Lihat Wacana Bacaan
                        </summary>
                        <p className="mt-2 whitespace-pre-line leading-relaxed">
                          {q.wacana}
                        </p>
                      </details>
                    )}

                    <p className="whitespace-pre-line text-sm font-medium leading-relaxed text-slate-900">
                      {q.pertanyaan}
                    </p>

                    <div className="mt-3.5 space-y-2">
                      {options.map((opt) => {
                        const isChosen = chosen === opt.key;
                        const isKey = q.kunciJawaban === opt.key;
                        const isTkp = q.kategori === 'TKP';

                        let rowClass = 'border-slate-200 bg-white text-slate-700';
                        if (isKey) {
                          rowClass =
                            'border-emerald-300 bg-emerald-50/70 text-emerald-950';
                        } else if (isChosen && !isKey) {
                          rowClass =
                            'border-rose-300 bg-rose-50/70 text-rose-950';
                        }

                        return (
                          <div
                            key={opt.key}
                            className={`flex items-start justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm ${rowClass}`}
                          >
                            <div className="flex min-w-0 items-start gap-2.5">
                              <span className="font-mono font-bold">
                                {opt.key}.
                              </span>
                              <span className="whitespace-pre-line leading-relaxed">
                                {opt.text}
                              </span>
                            </div>

                            <div className="flex shrink-0 items-center gap-2 font-mono text-[11px] font-bold tabular-nums">
                              {isTkp && (
                                <span
                                  className={`rounded-md px-2 py-0.5 ${
                                    opt.score === 5
                                      ? 'bg-emerald-200/80 text-emerald-900'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  Skor {opt.score}
                                </span>
                              )}
                              {isChosen && (
                                <span className="text-[#9D174D]">Pilihanmu</span>
                              )}
                              {isKey && (
                                <span className="text-emerald-700">
                                  {isTkp ? 'Terbaik' : 'Kunci'}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-3.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
                        Pembahasan (Kunci: {q.kunciJawaban as OptionKey})
                      </div>
                      <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-slate-700 sm:text-sm">
                        {q.pembahasan}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
