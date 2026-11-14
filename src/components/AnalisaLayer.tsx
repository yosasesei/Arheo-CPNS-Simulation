import React, { useMemo, useState } from 'react';
import {
  BookOpenText,
  Eye,
  Flame,
  Play,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import type {
  DrillConfig,
  Question,
  QuestionAttemptMap,
  QuestionCategory,
} from '../types/exam';
import {
  computeSubtestDistribution,
  getSortedOptionEntries,
} from '../utils/examEngine';

interface AnalisaLayerProps {
  allQuestions: Question[];
  attemptStats: QuestionAttemptMap;
  onStartDrill: (config: DrillConfig) => void;
}

type CategoryFilter = 'ALL' | QuestionCategory;

export const AnalisaLayer: React.FC<AnalisaLayerProps> = ({
  allQuestions,
  attemptStats,
  onStartDrill,
}) => {
  const [catFilter, setCatFilter] = useState<CategoryFilter>('ALL');
  const [hotsOnly, setHotsOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubtes, setSelectedSubtes] = useState<string>('ALL');
  const [inspectedQuestion, setInspectedQuestion] = useState<Question | null>(
    null
  );

  const subtests = useMemo(
    () => computeSubtestDistribution(allQuestions, attemptStats),
    [allQuestions, attemptStats]
  );

  const filteredSubtests = useMemo(() => {
    if (catFilter === 'ALL') return subtests;
    return subtests.filter((s) => s.kategori === catFilter);
  }, [subtests, catFilter]);

  const totalHots = useMemo(
    () => allQuestions.filter((q) => q.isHots).length,
    [allQuestions]
  );
  const totalWacana = useMemo(
    () => allQuestions.filter((q) => Boolean(q.wacana)).length,
    [allQuestions]
  );

  const totalAttemptedUnique = useMemo(
    () => Object.keys(attemptStats).length,
    [attemptStats]
  );

  const overallAccuracy = useMemo(() => {
    let earned = 0;
    let max = 0;
    for (const s of Object.values(attemptStats)) {
      earned += s.earnedScore;
      max += s.maxScore;
    }
    return max > 0 ? Math.round((earned / max) * 100) : null;
  }, [attemptStats]);

  const filteredQuestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return allQuestions.filter((q) => {
      if (catFilter !== 'ALL' && q.kategori !== catFilter) return false;
      if (hotsOnly && !q.isHots) return false;
      if (selectedSubtes !== 'ALL' && q.subtes !== selectedSubtes) return false;
      if (query) {
        const text =
          `${q.id} ${q.subtes} ${q.pertanyaan} ${q.pembahasan}`.toLowerCase();
        if (!text.includes(query)) return false;
      }
      return true;
    });
  }, [allQuestions, catFilter, hotsOnly, selectedSubtes, searchQuery]);

  const maxSubtestCount = useMemo(
    () => Math.max(1, ...filteredSubtests.map((s) => s.totalQuestions)),
    [filteredSubtests]
  );

  return (
    <div className="space-y-6">
      {/* Analytics KPI Summary */}
      <section
        aria-label="Ringkasan Analisa Bank Soal"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-semibold text-slate-500">
            Total Bank Soal
          </div>
          <div className="mt-1.5 font-mono text-2xl font-extrabold text-slate-900 tabular-nums">
            {allQuestions.length}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Tersebar pada {subtests.length} subtes
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-semibold text-slate-500">
            Komposisi Soal HOTS
          </div>
          <div className="mt-1.5 font-mono text-2xl font-extrabold text-amber-700 tabular-nums">
            {totalHots}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {allQuestions.length > 0
              ? `${Math.round((totalHots / allQuestions.length) * 100)}% dari total bank soal`
              : '0%'}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-semibold text-slate-500">
            Soal Berbasis Wacana
          </div>
          <div className="mt-1.5 font-mono text-2xl font-extrabold text-[#9D174D] tabular-nums">
            {totalWacana}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Pemahaman bacaan panjang & analisis teks
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-semibold text-slate-500">
            Akurasi Riwayat Anda
          </div>
          <div className="mt-1.5 font-mono text-2xl font-extrabold text-emerald-700 tabular-nums">
            {overallAccuracy !== null ? `${overallAccuracy}%` : 'Belum Diuji'}
          </div>
          <div className="mt-1 text-xs text-slate-500 tabular-nums">
            {totalAttemptedUnique} soal unik pernah dijawab
          </div>
        </article>
      </section>

      {/* Filter Bar */}
      <section
        aria-label="Filter Analisa Soal"
        className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center"
      >
        <div
          role="tablist"
          aria-label="Filter Kategori Analisa"
          className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs font-semibold"
        >
          {(['ALL', 'TWK', 'TIU', 'TKP'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={catFilter === cat}
              onClick={() => {
                setCatFilter(cat);
                setSelectedSubtes('ALL');
              }}
              className={`rounded-lg px-3.5 py-1.5 transition ${
                catFilter === cat
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat === 'ALL' ? 'Semua Kategori' : cat}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            aria-pressed={hotsOnly}
            onClick={() => setHotsOnly((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
              hotsOnly
                ? 'border-amber-400 bg-amber-50 text-amber-900'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Flame
              className={`h-3.5 w-3.5 ${
                hotsOnly ? 'text-amber-600' : 'text-slate-400'
              }`}
            />
            HOTS Saja ({totalHots})
          </button>
        </div>
      </section>

      {/* Subtest Distribution & Performance Breakdown */}
      <section
        aria-label="Peta Distribusi Subtes"
        className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Peta Distribusi & Performa Subtes
            </h2>
            <p className="text-xs text-slate-500">
              Klik subtes untuk memfilter daftar bedah soal atau langsung mulai
              latihan fokus 10 soal.
            </p>
          </div>
          {selectedSubtes !== 'ALL' && (
            <button
              type="button"
              onClick={() => setSelectedSubtes('ALL')}
              className="text-xs font-semibold text-[#9D174D] hover:underline"
            >
              Reset Subtes ({selectedSubtes})
            </button>
          )}
        </div>

        <div className="space-y-3">
          {filteredSubtests.map((item) => {
            const widthPct = Math.max(
              6,
              Math.round((item.totalQuestions / maxSubtestCount) * 100)
            );
            const isSelected = selectedSubtes === item.subtes;
            return (
              <div
                key={`${item.kategori}-${item.subtes}`}
                className={`rounded-xl border p-3.5 transition ${
                  isSelected
                    ? 'border-[#9D174D] bg-rose-50/40'
                    : 'border-slate-200 bg-slate-50/40 hover:bg-slate-50'
                }`}
              >
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedSubtes(isSelected ? 'ALL' : item.subtes)
                    }
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <span className="font-mono text-xs font-bold text-[#9D174D]">
                      {item.kategori}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="truncate text-sm font-bold text-slate-900">
                      {item.subtes}
                    </span>
                    {item.hotsCount > 0 && (
                      <span className="font-mono text-[11px] font-semibold text-amber-700">
                        · {item.hotsCount} HOTS
                      </span>
                    )}
                  </button>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-slate-600 tabular-nums">
                      {item.accuracyPercent !== null
                        ? `Akurasi ${item.accuracyPercent}%`
                        : `${item.totalQuestions} soal`}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onStartDrill({
                          label: `Fokus: ${item.subtes}`,
                          category: item.kategori,
                          subtes: item.subtes,
                          count: Math.min(10, item.totalQuestions),
                        })
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-100"
                    >
                      <Play className="h-3 w-3 text-[#9D174D]" />
                      Latih
                    </button>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-[#831843]"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                  <span className="w-16 text-right font-mono text-[11px] font-semibold text-slate-600 tabular-nums">
                    {item.totalQuestions} soal
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bedah Soal Explorer */}
      <section
        aria-label="Bedah & Eksplorasi Soal"
        className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
      >
        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Bedah Bank Soal ({filteredQuestions.length} Soal)
            </h2>
            <p className="text-xs text-slate-500">
              Cari kata kunci soal atau klik &ldquo;Bedah Soal&rdquo; untuk
              mempelajari kunci jawaban dan pembahasannya langsung.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari soal, subtes, atau ID..."
              aria-label="Cari soal"
              className="w-full rounded-xl border border-slate-300 bg-white py-2 pr-3 pl-9 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#9D174D] focus:outline-hidden"
            />
          </div>
        </div>

        <div className="mt-4 divide-y divide-slate-100">
          {filteredQuestions.slice(0, 15).map((q) => {
            const stat = attemptStats[q.id];
            return (
              <article
                key={q.id}
                className="flex flex-col justify-between gap-3 py-3.5 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono font-bold text-slate-900">
                      {q.id}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="font-bold text-[#9D174D]">
                      {q.kategori}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-600">{q.subtes}</span>
                    {q.isHots && (
                      <>
                        <span className="text-slate-300">·</span>
                        <span className="font-bold text-amber-700">HOTS</span>
                      </>
                    )}
                    {q.wacana && (
                      <>
                        <span className="text-slate-300">·</span>
                        <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                          <BookOpenText className="h-3 w-3" />
                          Wacana
                        </span>
                      </>
                    )}
                    {stat && (
                      <>
                        <span className="text-slate-300">·</span>
                        <span className="font-mono text-emerald-700 tabular-nums">
                          Pernah dijawab {stat.attempts}x
                        </span>
                      </>
                    )}
                  </div>
                  <p className="line-clamp-2 text-sm text-slate-800">
                    {q.pertanyaan}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setInspectedQuestion(q)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                >
                  <Eye className="h-3.5 w-3.5 text-[#9D174D]" />
                  Bedah Soal
                </button>
              </article>
            );
          })}

          {filteredQuestions.length === 0 && (
            <div className="py-10 text-center text-sm text-slate-500">
              Tidak ada soal yang cocok dengan filter pencarian Anda.
            </div>
          )}
        </div>

        {filteredQuestions.length > 15 && (
          <p className="mt-3 border-t border-slate-100 pt-3 text-center text-xs text-slate-500">
            Menampilkan 15 dari {filteredQuestions.length} soal teratas. Gunakan
            kolom pencarian atau filter subtes untuk menyaring lebih spesifik.
          </p>
        )}
      </section>

      {/* Bedah Soal Modal */}
      {inspectedQuestion && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Modal Bedah Soal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
        >
          <div className="flex max-h-[88vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#9D174D]">
                  <span>{inspectedQuestion.id}</span>
                  <span className="text-slate-300">·</span>
                  <span>{inspectedQuestion.subtes}</span>
                  {inspectedQuestion.isHots && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span className="text-amber-700">HOTS</span>
                    </>
                  )}
                </div>
                <h3 className="mt-0.5 text-base font-bold text-slate-900">
                  Bedah Soal & Pembahasan
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectedQuestion(null)}
                aria-label="Tutup bedah soal"
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {inspectedQuestion.wacana && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-700">
                  <div className="mb-1.5 font-bold uppercase tracking-wider text-slate-600">
                    Wacana Bacaan
                  </div>
                  <div className="whitespace-pre-line">
                    {inspectedQuestion.wacana}
                  </div>
                </div>
              )}

              <p className="whitespace-pre-line text-sm font-semibold leading-relaxed text-slate-900">
                {inspectedQuestion.pertanyaan}
              </p>

              <div className="space-y-2">
                {getSortedOptionEntries(inspectedQuestion).map((opt) => {
                  const isKey = inspectedQuestion.kunciJawaban === opt.key;
                  return (
                    <div
                      key={opt.key}
                      className={`flex items-start justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm ${
                        isKey
                          ? 'border-emerald-300 bg-emerald-50/70 text-emerald-950'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="font-mono font-bold">{opt.key}.</span>
                        <span className="whitespace-pre-line">{opt.text}</span>
                      </div>
                      <span className="shrink-0 font-mono text-[11px] font-bold text-emerald-700 tabular-nums">
                        {inspectedQuestion.kategori === 'TKP'
                          ? `Skor ${opt.score}`
                          : isKey
                          ? 'Kunci (+5)'
                          : '0'}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                  <Sparkles className="h-3.5 w-3.5 text-[#9D174D]" />
                  Pembahasan (Kunci: {inspectedQuestion.kunciJawaban})
                </div>
                <p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-slate-700 sm:text-sm">
                  {inspectedQuestion.pembahasan}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
