import React, { useMemo, useState } from 'react';
import {
  BookCheck,
  CheckSquare,
  Lightbulb,
  Play,
  Square,
} from 'lucide-react';
import type { DrillConfig, Question, QuestionCategory } from '../types/exam';
import { KISI_KISI_SKD, mapKisiToBankCoverage } from '../utils/kisiKisiData';

interface KisiKisiLayerProps {
  allQuestions: Question[];
  checkedKisiIds: string[];
  onToggleKisiCheck: (topicId: string) => void;
  onStartDrill: (config: DrillConfig) => void;
}

type KisiFilter = 'ALL' | QuestionCategory;

export const KisiKisiLayer: React.FC<KisiKisiLayerProps> = ({
  allQuestions,
  checkedKisiIds,
  onToggleKisiCheck,
  onStartDrill,
}) => {
  const [catFilter, setCatFilter] = useState<KisiFilter>('ALL');

  const coverageList = useMemo(
    () => mapKisiToBankCoverage(KISI_KISI_SKD, allQuestions),
    [allQuestions]
  );

  const visibleList = useMemo(() => {
    if (catFilter === 'ALL') return coverageList;
    return coverageList.filter((c) => c.topic.kategori === catFilter);
  }, [coverageList, catFilter]);

  const checkedCount = checkedKisiIds.length;
  const totalTopics = KISI_KISI_SKD.length;
  const progressPct = Math.round((checkedCount / totalTopics) * 100);

  return (
    <div className="space-y-6">
      {/* Official PermenPAN-RB Structure & Readiness Progress */}
      <section
        aria-label="Standar Kisi-Kisi SKD CPNS"
        className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
      >
        <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
          <div className="space-y-2 lg:col-span-7">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#9D174D]">
              <BookCheck className="h-4 w-4" />
              <span>Acuan Resmi SKD CPNS (110 Soal · 100 Menit)</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Kisi-Kisi Materi & Strategi Ambang Batas
            </h2>
            <p className="text-sm text-slate-600">
              Tandai topik yang sudah Anda kuasai dan langsung latih butir soal
              relevan dari bank soal offline pada setiap indikator.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 lg:col-span-5">
            <div className="flex items-baseline justify-between text-xs font-bold text-slate-800">
              <span>Progres Penguasaan Kisi-Kisi</span>
              <span className="font-mono tabular-nums">
                {checkedCount}/{totalTopics} Topik ({progressPct}%)
              </span>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center font-mono text-[11px] text-slate-600 tabular-nums">
              <div className="rounded-lg border border-slate-200/70 bg-white p-2">
                <div className="font-bold text-slate-900">TWK</div>
                <div className="mt-0.5 text-[10px]">30 Soal · PG 65</div>
              </div>
              <div className="rounded-lg border border-slate-200/70 bg-white p-2">
                <div className="font-bold text-slate-900">TIU</div>
                <div className="mt-0.5 text-[10px]">35 Soal · PG 80</div>
              </div>
              <div className="rounded-lg border border-slate-200/70 bg-white p-2">
                <div className="font-bold text-slate-900">TKP</div>
                <div className="mt-0.5 text-[10px]">45 Soal · PG 166</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <div
          role="tablist"
          aria-label="Filter Kategori Kisi-Kisi"
          className="inline-flex rounded-xl border border-slate-200 bg-white p-1 text-xs font-semibold"
        >
          {(['ALL', 'TWK', 'TIU', 'TKP'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={catFilter === cat}
              onClick={() => setCatFilter(cat)}
              className={`rounded-lg px-3.5 py-1.5 transition ${
                catFilter === cat
                  ? 'bg-[#5B0A2B] text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat === 'ALL' ? `Semua (${totalTopics})` : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Kisi-Kisi Topic Cards */}
      <section aria-label="Daftar Topik Kisi-Kisi" className="grid gap-4 md:grid-cols-2">
        {visibleList.map(({ topic, matchingQuestionCount, hotsCount }) => {
          const isChecked = checkedKisiIds.includes(topic.id);
          return (
            <article
              key={topic.id}
              className={`flex flex-col justify-between rounded-2xl border p-5 transition ${
                isChecked
                  ? 'border-emerald-300 bg-emerald-50/35'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <span className="text-[#9D174D]">{topic.kategori}</span>
                      <span className="text-slate-300">·</span>
                      <span className="font-mono text-slate-500 tabular-nums">
                        {matchingQuestionCount} Soal ({hotsCount} HOTS)
                      </span>
                    </div>
                    <h3 className="mt-1 text-base font-bold text-slate-900">
                      {topic.judul}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => onToggleKisiCheck(topic.id)}
                    aria-pressed={isChecked}
                    title={
                      isChecked
                        ? 'Tandai belum dikuasai'
                        : 'Tandai sudah dikuasai'
                    }
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition ${
                      isChecked
                        ? 'border-emerald-400 bg-emerald-100 text-emerald-900'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {isChecked ? (
                      <CheckSquare className="h-3.5 w-3.5 text-emerald-700" />
                    ) : (
                      <Square className="h-3.5 w-3.5 text-slate-400" />
                    )}
                    <span>{isChecked ? 'Dikuasai' : 'Tandai'}</span>
                  </button>
                </div>

                <p className="text-xs leading-relaxed text-slate-700 sm:text-sm">
                  {topic.indikator}
                </p>

                <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3 text-xs text-slate-700">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800">
                    <Lightbulb className="h-3.5 w-3.5 text-amber-600" />
                    <span>Tips Strategi CAT</span>
                  </div>
                  <p className="mt-1 leading-relaxed">{topic.strategi}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-[11px] font-medium text-slate-500">
                  Subtes: {topic.targetSubtes.slice(0, 2).join(', ')}
                </span>
                <button
                  type="button"
                  disabled={matchingQuestionCount === 0}
                  onClick={() =>
                    onStartDrill({
                      label: topic.judul,
                      category: topic.kategori,
                      keywords: topic.keywords,
                      count: Math.min(10, matchingQuestionCount),
                    })
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#5B0A2B] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#4A051D] disabled:opacity-40"
                >
                  <Play className="h-3.5 w-3.5" />
                  Latih Topik Ini
                </button>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
};
