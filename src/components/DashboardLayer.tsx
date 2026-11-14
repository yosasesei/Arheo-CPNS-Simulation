import React, { useMemo } from 'react';
import {
  ArrowRight,
  Award,
  BarChart2,
  BookOpen,
  CheckCircle2,
  Flame,
  Play,
  RotateCcw,
  Target,
  Trash2,
  TrendingUp,
  XCircle,
  Zap,
} from 'lucide-react';
import type {
  ActiveExamSession,
  CategoryCounts,
  DrillConfig,
  ExamHistory,
  ExamMode,
  HomeLayer,
  Question,
  QuestionAttemptMap,
  UserStats,
} from '../types/exam';
import {
  ALL_BADGES,
  PASSING_GRADES,
  calculateXpProgress,
  computeCategoryMastery,
  computeSubtestDistribution,
  formatCountdown,
} from '../utils/examEngine';
import { XpSevenDaysChart } from './XpSevenDaysChart';

interface DashboardLayerProps {
  stats: UserStats;
  counts: CategoryCounts;
  history: ExamHistory[];
  allQuestions: Question[];
  attemptStats: QuestionAttemptMap;
  activeSession: ActiveExamSession | null;
  onStartExam: (mode: ExamMode) => void;
  onStartDrill: (config: DrillConfig) => void;
  onResumeSession: () => void;
  onDiscardSession: () => void;
  onNavigateLayer: (layer: HomeLayer) => void;
}

export const DashboardLayer: React.FC<DashboardLayerProps> = ({
  stats,
  counts,
  history,
  allQuestions,
  attemptStats,
  activeSession,
  onStartExam,
  onStartDrill,
  onResumeSession,
  onDiscardSession,
  onNavigateLayer,
}) => {
  const xpInfo = calculateXpProgress(stats.totalXp);

  const catHistory = useMemo(
    () => history.filter((h) => h.mode === 'CAT_BKN'),
    [history]
  );

  const bestTotalScore = useMemo(() => {
    if (history.length === 0) return 0;
    return Math.max(...history.map((h) => h.totalScore));
  }, [history]);

  const passedCatCount = useMemo(
    () => catHistory.filter((h) => h.passedAll).length,
    [catHistory]
  );

  const hotsTotalCount = useMemo(
    () => allQuestions.filter((q) => q.isHots).length,
    [allQuestions]
  );

  const categoryMastery = useMemo(
    () => computeCategoryMastery(allQuestions, attemptStats),
    [allQuestions, attemptStats]
  );

  const subtestPriority = useMemo(() => {
    const dist = computeSubtestDistribution(allQuestions, attemptStats);
    const attempted = dist.filter((d) => d.accuracyPercent !== null);
    if (attempted.length > 0) {
      return [...attempted]
        .sort((a, b) => (a.accuracyPercent ?? 100) - (b.accuracyPercent ?? 100))
        .slice(0, 3);
    }
    return [...dist]
      .sort((a, b) => b.hotsCount - a.hotsCount)
      .slice(0, 3);
  }, [allQuestions, attemptStats]);

  const chartPoints = useMemo(() => {
    return [...history].slice(0, 6).reverse();
  }, [history]);

  const activeAnsweredCount = activeSession
    ? Object.keys(activeSession.answers).length
    : 0;

  return (
    <div className="space-y-6">
      {/* Active Session Resume Banner */}
      {activeSession && (
        <section
          aria-label="Sesi Ujian Aktif"
          className="flex flex-col justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50/70 p-4 sm:flex-row sm:items-center sm:p-5"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#9D174D]">
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Sesi Ujian Belum Selesai</span>
            </div>
            <p className="text-sm font-semibold text-[#1C1420] sm:text-base">
              {activeSession.mode === 'CAT_BKN'
                ? 'Simulasi CAT BKN Penuh'
                : activeSession.mode === 'ARCADE'
                ? 'Arena Tantangan Cepat'
                : activeSession.drillLabel || 'Latihan Fokus Subtes'}{' '}
              — Soal {activeSession.currentIndex + 1} dari{' '}
              {activeSession.questionIds.length}
            </p>
            <p className="font-mono text-xs text-[#6B5D73] tabular-nums">
              Terjawab: {activeAnsweredCount}/{activeSession.questionIds.length} ·
              Ragu-ragu: {activeSession.doubtfulIds.length} · Sisa Waktu:{' '}
              {formatCountdown(activeSession.remainingSeconds)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onDiscardSession}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#DFD5E3] bg-white px-3.5 py-2 text-xs font-semibold text-[#4A3E52] transition hover:bg-slate-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Hapus Sesi
            </button>
            <button
              type="button"
              onClick={onResumeSession}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#9D174D] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#831843]"
            >
              <Play className="h-4 w-4" />
              Lanjutkan Ujian
            </button>
          </div>
        </section>
      )}

      {/* Hero Command Deck */}
      <section
        aria-label="Ringkasan Kesiapan SKD"
        className="artheo-hero rounded-2xl border border-[#5B0A2B] p-6 text-white sm:p-7"
      >
        <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
          <div className="space-y-3 lg:col-span-7">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300">
              <Target className="h-3.5 w-3.5" />
              <span>Ora et Labora · CPNS 2027</span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-[28px]">
              Dalam Penyertaan Tuhan, Lancarkan Proses CPNS 2027
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-rose-100/90">
              Serahkan setiap jerih lelahmu kepada Tuhan yang selalu menuntun
              langkahmu. Tekuni soal dengan segenap hati, benahi diri melalui
              Analisa Soal &amp; Kisi-Kisi, dan imani rancangan-Nya yang penuh
              damai sejahtera serta hari depan yang penuh harapan di tahun 2027.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                disabled={counts.total === 0}
                onClick={() => onStartExam('CAT_BKN')}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-[#3B0722] transition hover:bg-amber-300 disabled:opacity-50"
              >
                <Play className="h-4 w-4" />
                Mulai Simulasi CAT BKN
              </button>
              <button
                type="button"
                disabled={counts.total === 0}
                onClick={() => onStartExam('ARCADE')}
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15 disabled:opacity-50"
              >
                <Zap className="h-4 w-4 text-amber-300" />
                Arena Cepat (15 Soal)
              </button>
            </div>
          </div>

          {/* Right Level & Streak Summary Box */}
          <div className="rounded-2xl border border-white/15 bg-black/20 p-5 backdrop-blur-xs lg:col-span-5">
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-rose-200">
                  Level Pejuang NIP
                </div>
                <div className="mt-0.5 text-xl font-extrabold">
                  Level {xpInfo.level}
                </div>
              </div>
              <div className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-amber-300 tabular-nums">
                <Flame className="h-4 w-4" />
                {stats.currentStreak} Hari Streak
              </div>
            </div>

            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-300 via-rose-400 to-violet-400 transition-all duration-300"
                style={{ width: `${xpInfo.percent}%` }}
              />
            </div>

            <div className="mt-2 flex items-center justify-between font-mono text-xs text-rose-100/90 tabular-nums">
              <span>Total: {stats.totalXp} XP</span>
              <span>
                {xpInfo.currentLevelXp} / {xpInfo.neededForNextLevel} XP
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4 KPI Summary Cards */}
      <section
        aria-label="Metrik Utama"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <article className="rounded-2xl border border-[#EAE3EC] bg-white p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-[#6B5D73]">
            <span>Skor Tertinggi</span>
            <TrendingUp className="h-4 w-4 text-[#9D174D]" />
          </div>
          <div className="mt-2 font-mono text-2xl font-extrabold text-[#1C1420] tabular-nums">
            {bestTotalScore}
          </div>
          <p className="mt-1 text-xs text-[#6B5D73]">
            {history.length > 0
              ? `Dari ${history.length} sesi tryout tercatat`
              : 'Target maksimal SKD: 550 poin'}
          </p>
        </article>

        <article className="rounded-2xl border border-[#EAE3EC] bg-white p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-[#6B5D73]">
            <span>Kelulusan CAT BKN</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 font-mono text-2xl font-extrabold text-[#1C1420] tabular-nums">
            {passedCatCount} / {catHistory.length}
          </div>
          <p className="mt-1 text-xs text-[#6B5D73]">
            Ambang batas: TWK 65 · TIU 80 · TKP 166
          </p>
        </article>

        <article className="rounded-2xl border border-[#EAE3EC] bg-white p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-[#6B5D73]">
            <span>Bank Soal Offline</span>
            <BookOpen className="h-4 w-4 text-[#6D28D9]" />
          </div>
          <div className="mt-2 font-mono text-2xl font-extrabold text-[#1C1420] tabular-nums">
            {counts.total}
          </div>
          <p className="mt-1 text-xs text-[#6B5D73]">
            {counts.TWK} TWK · {counts.TIU} TIU · {counts.TKP} TKP ·{' '}
            {hotsTotalCount} HOTS
          </p>
        </article>

        <article className="rounded-2xl border border-[#EAE3EC] bg-white p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-[#6B5D73]">
            <span>Lencana Terbuka</span>
            <Award className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 font-mono text-2xl font-extrabold text-[#1C1420] tabular-nums">
            {stats.unlockedBadges.length} / {ALL_BADGES.length}
          </div>
          <p className="mt-1 text-xs text-[#6B5D73]">
            Selesaikan simulasi untuk membuka semua lencana
          </p>
        </article>
      </section>

      {/* Main Charts Row: 7-Day XP Bar Chart (Recharts) + Score Trend Chart */}
      <section className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <XpSevenDaysChart
            history={history}
            currentStreak={stats.currentStreak}
            hasQuestions={counts.total > 0}
            onStartQuickArcade={() => onStartExam('ARCADE')}
          />
        </div>

        <article className="flex h-full flex-col justify-between rounded-2xl border border-[#EAE3EC] bg-white p-5 sm:p-6 lg:col-span-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-[#1C1420]">
                Grafik Tren Skor Tryout
              </h3>
              <p className="text-xs text-[#6B5D73]">
                Perbandingan skor TWK, TIU, dan TKP pada sesi terakhir Anda
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateLayer('analisa')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#9D174D] hover:text-[#6E0F2A]"
            >
              Analisa Mendalam
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {chartPoints.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-[#DFD5E3] bg-[#FAF8FA] p-6">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#4A3E52]">
                <BarChart2 className="h-4 w-4 text-[#9D174D]" />
                <span>Target Ambang Batas Resmi BKN</span>
              </div>
              <div className="mt-4 space-y-3">
                {[
                  {
                    label: 'TWK',
                    pg: PASSING_GRADES.TWK,
                    max: 150,
                    color: 'bg-[#9D174D]',
                  },
                  {
                    label: 'TIU',
                    pg: PASSING_GRADES.TIU,
                    max: 175,
                    color: 'bg-[#7E22CE]',
                  },
                  {
                    label: 'TKP',
                    pg: PASSING_GRADES.TKP,
                    max: 225,
                    color: 'bg-amber-500',
                  },
                ].map((bar) => (
                  <div key={bar.label} className="space-y-1">
                    <div className="flex justify-between font-mono text-xs tabular-nums">
                      <span className="font-bold text-[#1C1420]">{bar.label}</span>
                      <span className="text-[#6B5D73]">
                        PG Minimal: {bar.pg} / Maks {bar.max}
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#E8DFEB]">
                      <div
                        className={`h-full rounded-full ${bar.color}`}
                        style={{ width: `${Math.round((bar.pg / bar.max) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-[#6B5D73]">
                Mulai simulasi pertama Anda untuk melihat grafik tren skor
                riil secara otomatis di sini.
              </p>
            </div>
          ) : (
            <div className="mt-5">
              <svg
                viewBox="0 0 560 210"
                className="h-52 w-full"
                role="img"
                aria-label="Grafik skor tryout terakhir"
              >
                {[0, 50, 100, 150, 200].map((val) => {
                  const y = 175 - (val / 225) * 145;
                  return (
                    <g key={val}>
                      <line
                        x1="36"
                        y1={y}
                        x2="545"
                        y2={y}
                        stroke="#EAE3EC"
                        strokeDasharray="3 3"
                      />
                      <text
                        x="30"
                        y={y + 4}
                        textAnchor="end"
                        className="fill-[#7C6D85] text-[10px]"
                      >
                        {val}
                      </text>
                    </g>
                  );
                })}

                {chartPoints.map((pt, idx) => {
                  const slotWidth = 500 / Math.max(chartPoints.length, 1);
                  const centerX = 42 + idx * slotWidth + slotWidth / 2;
                  const barW = Math.min(18, slotWidth * 0.22);

                  const twkH = Math.max(3, (pt.twkScore / 225) * 145);
                  const tiuH = Math.max(3, (pt.tiuScore / 225) * 145);
                  const tkpH = Math.max(3, (pt.tkpScore / 225) * 145);

                  return (
                    <g key={pt.id}>
                      <rect
                        x={centerX - barW * 1.6}
                        y={175 - twkH}
                        width={barW}
                        height={twkH}
                        rx="3"
                        fill="#9D174D"
                      />
                      <rect
                        x={centerX - barW * 0.5}
                        y={175 - tiuH}
                        width={barW}
                        height={tiuH}
                        rx="3"
                        fill="#7E22CE"
                      />
                      <rect
                        x={centerX + barW * 0.6}
                        y={175 - tkpH}
                        width={barW}
                        height={tkpH}
                        rx="3"
                        fill="#F59E0B"
                      />
                      <text
                        x={centerX}
                        y="194"
                        textAnchor="middle"
                        className="fill-[#4A3E52] text-[10px] font-semibold"
                      >
                        Sesi #{idx + 1}
                      </text>
                    </g>
                  );
                })}
              </svg>

              <div className="mt-2 flex flex-wrap items-center gap-5 text-xs font-medium text-[#6B5D73]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-xs bg-[#9D174D]" />
                  TWK
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-xs bg-[#7E22CE]" />
                  TIU
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-xs bg-amber-500" />
                  TKP
                </span>
              </div>
            </div>
          )}
        </article>
      </section>

      {/* Mastery & Badges Row */}
      <section className="grid gap-6 lg:grid-cols-12">
        <article className="flex h-full flex-col justify-between rounded-2xl border border-[#EAE3EC] bg-white p-5 sm:p-6 lg:col-span-5">
          <div>
            <h3 className="text-base font-bold text-[#1C1420]">
              Penguasaan & Rekomendasi Fokus
            </h3>
            <p className="mt-0.5 text-xs text-[#6B5D73]">
              Akurasi riil berdasarkan soal yang pernah Anda kerjakan
            </p>

            <div className="mt-4 grid grid-cols-3 gap-2.5">
              {(['TWK', 'TIU', 'TKP'] as const).map((cat) => {
                const m = categoryMastery[cat];
                return (
                  <div
                    key={cat}
                    className="rounded-xl border border-[#EAE3EC] bg-[#FAF8FA] p-3"
                  >
                    <div className="text-xs font-bold text-[#6B5D73]">{cat}</div>
                    <div className="mt-1 font-mono text-lg font-extrabold text-[#1C1420] tabular-nums">
                      {m.accuracyPercent !== null ? `${m.accuracyPercent}%` : '—'}
                    </div>
                    <div className="text-[11px] text-[#6B5D73] tabular-nums">
                      {m.attempted} soal diuji
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5">
              <div className="mb-2 text-xs font-bold uppercase tracking-wider text-[#6B5D73]">
                Prioritas Latihan Disarankan
              </div>
              <div className="space-y-2">
                {subtestPriority.map((item) => (
                  <div
                    key={`${item.kategori}-${item.subtes}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[#EAE3EC] px-3.5 py-2.5"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-xs font-bold text-[#1C1420]">
                        {item.kategori} · {item.subtes}
                      </div>
                      <div className="text-[11px] text-[#6B5D73] tabular-nums">
                        {item.accuracyPercent !== null
                          ? `Akurasi: ${item.accuracyPercent}%`
                          : `${item.totalQuestions} soal (${item.hotsCount} HOTS)`}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onStartDrill({
                          label: `Fokus: ${item.subtes}`,
                          category: item.kategori,
                          subtes: item.subtes,
                          count: 10,
                        })
                      }
                      className="shrink-0 rounded-lg border border-[#DFD5E3] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#6E0F2A] hover:bg-rose-50"
                    >
                      Latih
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateLayer('kisi')}
            className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#EAE3EC] bg-[#FAF8FA] px-4 py-2.5 text-xs font-bold text-[#4A3E52] hover:bg-rose-50/50"
          >
            Buka Kisi-Kisi & Checklist Materi
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </article>

        <article className="flex h-full flex-col justify-between rounded-2xl border border-[#EAE3EC] bg-white p-5 sm:p-6 lg:col-span-7">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#1C1420]">
                  Lencana Pencapaian
                </h3>
                <p className="mt-0.5 text-xs text-[#6B5D73]">
                  Penghargaan otomatis saat menembus target skor dan akurasi
                </p>
              </div>
              <span className="font-mono text-xs text-[#6B5D73] tabular-nums">
                {stats.unlockedBadges.length}/{ALL_BADGES.length} Terbuka
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {ALL_BADGES.map((badge) => {
                const unlocked = stats.unlockedBadges.includes(badge.id);
                return (
                  <div
                    key={badge.id}
                    className={`flex items-start gap-2.5 rounded-xl border p-3.5 ${
                      unlocked
                        ? 'border-emerald-200 bg-emerald-50/50 text-[#1C1420]'
                        : 'border-[#EAE3EC] bg-[#FAF8FA] text-[#6B5D73]'
                    }`}
                  >
                    <Award
                      className={`mt-0.5 h-4 w-4 shrink-0 ${
                        unlocked ? 'text-emerald-600' : 'text-[#9B8CA4]'
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold">{badge.title}</div>
                      <p className="mt-0.5 text-[11px] leading-snug text-[#6B5D73]">
                        {badge.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-[#EAE3EC] bg-[#FAF8FA] px-4 py-3 text-xs text-[#6B5D73]">
            Tips: Gunakan mode <strong className="text-[#1C1420]">Arena Cepat</strong> untuk
            membangun combo jawaban benar beruntun dan mempercepat kenaikan Level XP.
          </div>
        </article>
      </section>

      {/* Recent Activity Row */}
      <section>
        <article className="rounded-2xl border border-[#EAE3EC] bg-white p-5 sm:p-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-bold text-[#1C1420]">
              Aktivitas Tryout Terakhir
            </h3>
            <button
              type="button"
              onClick={() => onNavigateLayer('simulasi')}
              className="text-xs font-semibold text-[#9D174D] hover:text-[#6E0F2A]"
            >
              Semua Riwayat
            </button>
          </div>

          {history.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#DFD5E3] bg-[#FAF8FA] px-4 py-8 text-center text-xs text-[#6B5D73]">
              Belum ada aktivitas ujian. Mulai Simulasi CAT BKN atau Arena Cepat
              untuk mencatat riwayat pertama Anda.
            </div>
          ) : (
            <div className="divide-y divide-[#F0EBF2]">
              {history.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-1 last:pb-1"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#1C1420]">
                      <span className="truncate">
                        {item.mode === 'CAT_BKN'
                          ? 'Simulasi CAT BKN'
                          : item.mode === 'ARCADE'
                          ? 'Arena Cepat'
                          : item.drillLabel || 'Latihan Fokus'}
                      </span>
                      <span
                        className={`inline-flex items-center gap-0.5 font-bold ${
                          item.passedAll ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {item.passedAll ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        {item.passedAll ? 'Lulus' : 'Belum'}
                      </span>
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-[#6B5D73] tabular-nums">
                      TWK {item.twkScore} · TIU {item.tiuScore} · TKP{' '}
                      {item.tkpScore}
                    </div>
                  </div>
                  <div className="text-right font-mono text-xs tabular-nums">
                    <div className="font-bold text-[#1C1420]">
                      {item.totalScore} Poin
                    </div>
                    <div className="text-[11px] text-[#9D174D]">
                      +{item.xpEarned} XP
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </div>
  );
};
