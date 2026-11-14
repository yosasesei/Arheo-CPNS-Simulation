import React, { useMemo } from 'react';
import { Flame, Play, Sparkles } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ExamHistory } from '../types/exam';
import { computeLast7DaysXpProgress, type DailyXpPoint } from '../utils/examEngine';

interface XpSevenDaysChartProps {
  history: readonly ExamHistory[];
  currentStreak: number;
  hasQuestions: boolean;
  onStartQuickArcade: () => void;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: DailyXpPoint;
    value?: number;
  }>;
}

const CustomXpTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;

  return (
    <div className="rounded-xl border border-[#EAE3EC] bg-white px-3.5 py-2.5 shadow-lg">
      <div className="text-[11px] font-bold uppercase tracking-wider text-[#6B5D73]">
        {point.fullDateLabel}
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="font-mono text-base font-extrabold text-[#9D174D] tabular-nums">
          +{point.xp} XP
        </span>
        <span className="text-xs text-[#6B5D73] tabular-nums">
          · {point.sessions} sesi
        </span>
      </div>
    </div>
  );
};

export const XpSevenDaysChart: React.FC<XpSevenDaysChartProps> = ({
  history,
  currentStreak,
  hasQuestions,
  onStartQuickArcade,
}) => {
  const dailyPoints = useMemo(
    () => computeLast7DaysXpProgress(history),
    [history]
  );

  const total7dXp = useMemo(
    () => dailyPoints.reduce((acc, d) => acc + d.xp, 0),
    [dailyPoints]
  );

  const activeDaysCount = useMemo(
    () => dailyPoints.filter((d) => d.xp > 0).length,
    [dailyPoints]
  );

  const todayPoint = dailyPoints[dailyPoints.length - 1];
  const todayXp = todayPoint?.xp ?? 0;
  const todaySessions = todayPoint?.sessions ?? 0;

  return (
    <article
      aria-label="Grafik Progres XP 7 Hari Terakhir"
      className="flex h-full flex-col justify-between rounded-2xl border border-[#EAE3EC] bg-white p-5 sm:p-6"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-[#1C1420]">
              Progres XP 7 Hari Terakhir
            </h3>
            <p className="mt-0.5 text-xs text-[#6B5D73]">
              Akumulasi XP harian untuk menjaga konsistensi belajar Anda
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3.5 text-right">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#6B5D73]">
                Total 7 Hari
              </div>
              <div className="font-mono text-sm font-extrabold text-[#9D174D] tabular-nums">
                +{total7dXp} XP
              </div>
            </div>
            <div className="h-7 w-px bg-[#EAE3EC]" aria-hidden="true" />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#6B5D73]">
                Hari Aktif
              </div>
              <div className="font-mono text-sm font-extrabold text-[#1C1420] tabular-nums">
                {activeDaysCount}/7
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 h-[216px] w-full min-w-0">
          <ResponsiveContainer width="100%" height={216} minWidth={0}>
            <BarChart
              data={dailyPoints}
              margin={{ top: 12, right: 8, left: -18, bottom: 2 }}
              barCategoryGap="24%"
            >
              <defs>
                <linearGradient id="xpBarBrand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9D174D" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#7E22CE" stopOpacity={0.85} />
                </linearGradient>
                <linearGradient id="xpBarToday" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity={1} />
                  <stop offset="100%" stopColor="#9D174D" stopOpacity={0.95} />
                </linearGradient>
              </defs>

              <CartesianGrid
                stroke="#F0EBF2"
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="shortDay"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B5D73', fontSize: 11, fontWeight: 600 }}
                dy={6}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                domain={[
                  0,
                  (dataMax: number) =>
                    Math.max(100, Math.ceil((dataMax * 1.2) / 25) * 25),
                ]}
                tick={{ fill: '#7C6D85', fontSize: 10 }}
              />

              <Tooltip
                content={<CustomXpTooltip />}
                cursor={{ fill: '#FAF5FA', radius: 6 }}
              />

              <Bar
                dataKey="xp"
                name="XP Harian"
                radius={[6, 6, 0, 0]}
                maxBarSize={38}
                isAnimationActive={false}
              >
                {dailyPoints.map((entry) => (
                  <Cell
                    key={entry.dateKey}
                    fill={
                      entry.xp <= 0
                        ? '#EAE3EC'
                        : entry.isToday
                        ? 'url(#xpBarToday)'
                        : 'url(#xpBarBrand)'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#6B5D73]">
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-gradient-to-b from-amber-500 to-[#9D174D]" />
              XP Hari Ini
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-gradient-to-b from-[#9D174D] to-[#7E22CE]" />
              6 Hari Sebelumnya
            </span>
          </div>
          <span className="inline-flex items-center gap-1 font-mono font-semibold text-amber-700 tabular-nums">
            <Flame className="h-3.5 w-3.5 text-amber-500" />
            Streak: {currentStreak} Hari
          </span>
        </div>
      </div>

      {/* Motivational status footer */}
      <div className="mt-4 flex flex-col justify-between gap-2.5 rounded-xl border border-[#EAE3EC] bg-[#FAF8FA] px-3.5 py-2.5 sm:flex-row sm:items-center">
        <div className="flex items-start gap-2 text-xs text-[#4A3E52]">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#9D174D]" />
          {todayXp > 0 ? (
            <span>
              Mantap! Hari ini Anda sudah meraih{' '}
              <strong className="font-mono text-[#9D174D] tabular-nums">
                +{todayXp} XP
              </strong>{' '}
              dari {todaySessions} sesi latihan.
            </span>
          ) : total7dXp > 0 ? (
            <span>
              Minggu ini sudah terkumpul{' '}
              <strong className="font-mono text-[#1C1420] tabular-nums">
                +{total7dXp} XP
              </strong>
              . Tambah 1 sesi hari ini agar batang Hari Ini menyala.
            </span>
          ) : (
            <span>
              Belum ada XP minggu ini. Taklukkan 15 soal Arena Cepat untuk
              mencetak batang XP pertama Anda.
            </span>
          )}
        </div>

        {todayXp === 0 && (
          <button
            type="button"
            disabled={!hasQuestions}
            onClick={onStartQuickArcade}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#9D174D] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#831843] disabled:opacity-50"
          >
            <Play className="h-3 w-3" />
            Arena Cepat
          </button>
        )}
      </div>
    </article>
  );
};
