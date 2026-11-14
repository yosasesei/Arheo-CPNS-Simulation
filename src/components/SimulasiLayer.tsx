import React, { useRef } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Flame,
  History,
  Play,
  Sparkles,
  Upload,
  XCircle,
  Zap,
} from 'lucide-react';
import type {
  CategoryCounts,
  DrillConfig,
  ExamHistory,
  ExamMode,
  Question,
} from '../types/exam';

interface SimulasiLayerProps {
  counts: CategoryCounts;
  allQuestions: Question[];
  history: ExamHistory[];
  importing: boolean;
  onStartExam: (mode: ExamMode) => void;
  onStartDrill: (config: DrillConfig) => void;
  onImportFile: (file: File) => void;
}

function formatDateTime(ts: number): string {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(ts));
  } catch {
    return new Date(ts).toLocaleString();
  }
}

export const SimulasiLayer: React.FC<SimulasiLayerProps> = ({
  counts,
  allQuestions,
  history,
  importing,
  onStartExam,
  onStartDrill,
  onImportFile,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canStart = counts.total > 0;
  const hotsCount = allQuestions.filter((q) => q.isHots).length;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportFile(file);
    }
    e.target.value = '';
  };

  const drillPresets: Array<{
    title: string;
    desc: string;
    meta: string;
    config: DrillConfig;
  }> = [
    {
      title: 'Drill Fokus TWK',
      desc: '10 soal acak Wawasan Kebangsaan',
      meta: `${counts.TWK} soal tersedia`,
      config: { label: 'Drill Fokus TWK', category: 'TWK', count: 10 },
    },
    {
      title: 'Drill Fokus TIU',
      desc: '10 soal acak Intelegensia Umum',
      meta: `${counts.TIU} soal tersedia`,
      config: { label: 'Drill Fokus TIU', category: 'TIU', count: 10 },
    },
    {
      title: 'Drill Fokus TKP',
      desc: '10 soal skala kematangan 1–5',
      meta: `${counts.TKP} soal tersedia`,
      config: { label: 'Drill Fokus TKP', category: 'TKP', count: 10 },
    },
    {
      title: 'Tantangan Soal HOTS',
      desc: '10 soal penalaran tingkat tinggi',
      meta: `${hotsCount} soal HOTS`,
      config: { label: 'Tantangan Soal HOTS', hotsOnly: true, count: 10 },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Main Exam Mode Cards */}
      <section aria-label="Mode Ujian Utama" className="grid gap-5 md:grid-cols-2">
        <article className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#9D174D]">
                Standar Resmi BKN
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-slate-600 tabular-nums">
                <Clock className="h-3.5 w-3.5" />
                100 Menit
              </span>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Simulasi CAT BKN Penuh
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                Ujian lengkap 110 soal acak terkalibrasi dengan sistem bobot dan
                ambang batas resmi SKD CPNS.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 border-t border-slate-100 pt-4 text-xs">
              <div className="rounded-lg bg-slate-50 p-2.5">
                <div className="font-semibold text-slate-500">TWK</div>
                <div className="mt-0.5 font-mono text-sm font-bold text-slate-900 tabular-nums">
                  30 Soal
                </div>
                <div className="text-[11px] text-slate-500">PG: 65</div>
              </div>
              <div className="rounded-lg bg-slate-50 p-2.5">
                <div className="font-semibold text-slate-500">TIU</div>
                <div className="mt-0.5 font-mono text-sm font-bold text-slate-900 tabular-nums">
                  35 Soal
                </div>
                <div className="text-[11px] text-slate-500">PG: 80</div>
              </div>
              <div className="rounded-lg bg-slate-50 p-2.5">
                <div className="font-semibold text-slate-500">TKP</div>
                <div className="mt-0.5 font-mono text-sm font-bold text-slate-900 tabular-nums">
                  45 Soal
                </div>
                <div className="text-[11px] text-slate-500">PG: 166</div>
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={!canStart}
            onClick={() => onStartExam('CAT_BKN')}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#5B0A2B] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#4A051D] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Play className="h-4 w-4" />
            Mulai Simulasi CAT BKN (110 Soal)
          </button>
        </article>

        <article className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                Mode Arcade · Combo XP
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-slate-600 tabular-nums">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                5 Menit
              </span>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Arena Tantangan Cepat
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                Latihan kilat 15 soal acak lintas TWK, TIU, dan TKP. Jawab benar
                berturut-turut untuk melipatgandakan bonus XP.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 border-t border-slate-100 pt-4 text-xs">
              <div className="rounded-lg bg-slate-50 p-2.5">
                <div className="font-semibold text-slate-500">Paket</div>
                <div className="mt-0.5 font-mono text-sm font-bold text-slate-900 tabular-nums">
                  15 Soal
                </div>
                <div className="text-[11px] text-slate-500">Acak</div>
              </div>
              <div className="rounded-lg bg-slate-50 p-2.5">
                <div className="font-semibold text-slate-500">Durasi</div>
                <div className="mt-0.5 font-mono text-sm font-bold text-slate-900 tabular-nums">
                  05:00
                </div>
                <div className="text-[11px] text-slate-500">Cepat</div>
              </div>
              <div className="rounded-lg bg-slate-50 p-2.5">
                <div className="font-semibold text-slate-500">Reward</div>
                <div className="mt-0.5 font-mono text-sm font-bold text-amber-700 tabular-nums">
                  Combo XP
                </div>
                <div className="text-[11px] text-slate-500">Berlipat</div>
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={!canStart}
            onClick={() => onStartExam('ARCADE')}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Zap className="h-4 w-4 text-amber-600" />
            Mulai Arena Cepat (15 Soal)
          </button>
        </article>
      </section>

      {/* Latihan Fokus / Drill Section */}
      <section aria-label="Latihan Fokus Kategori" className="space-y-3">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-[#9D174D]" />
          <h3 className="text-base font-bold text-slate-900">
            Latihan Fokus Terarah (10 Soal · 10 Menit)
          </h3>
        </div>
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {drillPresets.map((preset) => (
            <button
              key={preset.title}
              type="button"
              disabled={!canStart}
              onClick={() => onStartDrill(preset.config)}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-rose-300 hover:bg-rose-50/40 disabled:opacity-50"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">
                    {preset.title}
                  </span>
                  <Sparkles className="h-3.5 w-3.5 text-[#9D174D]" />
                </div>
                <p className="mt-1 text-xs text-slate-600">{preset.desc}</p>
              </div>
              <div className="mt-3 border-t border-slate-100 pt-2.5 font-mono text-[11px] font-semibold text-[#9D174D] tabular-nums">
                {preset.meta} →
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Bank Soal Lokal & Impor Paket (.json) */}
      <section
        aria-label="Bank Soal Tersimpan"
        className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:p-6"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <BookOpen className="h-4 w-4 text-[#9D174D]" />
            <span>Bank Soal Lokal (IndexedDB Offline)</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-600">
            <span>
              Total:{' '}
              <strong className="font-mono text-slate-900 tabular-nums">
                {counts.total}
              </strong>{' '}
              soal
            </span>
            <span>
              TWK:{' '}
              <strong className="font-mono text-slate-900 tabular-nums">
                {counts.TWK}
              </strong>
            </span>
            <span>
              TIU:{' '}
              <strong className="font-mono text-slate-900 tabular-nums">
                {counts.TIU}
              </strong>
            </span>
            <span>
              TKP:{' '}
              <strong className="font-mono text-slate-900 tabular-nums">
                {counts.TKP}
              </strong>
            </span>
          </div>
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
            aria-label="Pilih file JSON paket soal"
          />
          <button
            type="button"
            disabled={importing}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-60"
          >
            <Upload className="h-4 w-4 text-slate-600" />
            {importing ? 'Mengimpor...' : 'Impor Paket Soal (.json)'}
          </button>
        </div>
      </section>

      {/* Full Exam History List */}
      <section
        aria-label="Riwayat Skor Tryout Lengkap"
        className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-slate-600" />
            <h3 className="text-base font-bold text-slate-900">
              Riwayat Skor Tryout
            </h3>
          </div>
          <span className="font-mono text-xs text-slate-500 tabular-nums">
            {history.length} Sesi
          </span>
        </div>

        {history.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center">
            <p className="text-sm font-medium text-slate-600">
              Belum ada riwayat simulasi tersimpan.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Pilih salah satu mode ujian di atas untuk mulai berlatih.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between gap-3 py-3.5 sm:flex-row sm:items-center"
              >
                <div className="space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">
                      {item.mode === 'CAT_BKN'
                        ? 'Simulasi CAT BKN'
                        : item.mode === 'ARCADE'
                        ? 'Arena Tantangan Cepat'
                        : item.drillLabel || 'Latihan Fokus'}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold ${
                        item.passedAll ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {item.passedAll ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" />
                      )}
                      {item.mode === 'CAT_BKN'
                        ? item.passedAll
                          ? 'LULUS PG'
                          : 'BELUM LULUS'
                        : item.passedAll
                        ? 'TARGET TERCAPAI'
                        : 'PERLU LATIHAN'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {formatDateTime(item.timestamp)} · Terjawab{' '}
                    {item.answeredCount}/{item.totalQuestions} ·{' '}
                    <span className="font-mono text-[#9D174D] tabular-nums">
                      +{item.xpEarned} XP
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 font-mono text-xs tabular-nums">
                  <div>
                    <span className="text-slate-500">TWK </span>
                    <strong className="text-slate-900">{item.twkScore}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">TIU </span>
                    <strong className="text-slate-900">{item.tiuScore}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">TKP </span>
                    <strong className="text-slate-900">{item.tkpScore}</strong>
                  </div>
                  <div className="rounded-lg bg-slate-100 px-2.5 py-1 font-bold text-slate-900">
                    Total {item.totalScore}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
