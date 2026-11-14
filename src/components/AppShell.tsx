import React from 'react';
import {
  BarChart3,
  BookMarked,
  Compass,
  Flame,
  LayoutDashboard,
  PlayCircle,
  Sparkles,
} from 'lucide-react';
import type { CategoryCounts, HomeLayer, UserStats } from '../types/exam';
import { calculateXpProgress } from '../utils/examEngine';
import {
  HeaderXpCounter,
  useAnimatedXp,
  type XpTransitionState,
} from './AnimatedXpCounter';

interface AppShellProps {
  activeLayer: HomeLayer;
  onChangeLayer: (layer: HomeLayer) => void;
  stats: UserStats;
  counts: CategoryCounts;
  xpTransition?: XpTransitionState | null;
  onXpTransitionComplete?: () => void;
  children: React.ReactNode;
}

const NAV_ITEMS: Array<{
  id: HomeLayer;
  label: string;
  shortLabel: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    shortLabel: 'Dashboard',
    subtitle: 'Ringkasan progres & tren',
    icon: LayoutDashboard,
  },
  {
    id: 'simulasi',
    label: 'Simulasi & Bank',
    shortLabel: 'Simulasi',
    subtitle: 'CAT BKN, Arcade & Impor',
    icon: PlayCircle,
  },
  {
    id: 'analisa',
    label: 'Analisa Soal',
    shortLabel: 'Analisa',
    subtitle: 'Bedah subtes & akurasi',
    icon: BarChart3,
  },
  {
    id: 'kisi',
    label: 'Kisi-Kisi SKD',
    shortLabel: 'Kisi-Kisi',
    subtitle: 'Blueprint PermenPAN-RB',
    icon: BookMarked,
  },
];

export const AppShell: React.FC<AppShellProps> = ({
  activeLayer,
  onChangeLayer,
  stats,
  counts,
  xpTransition = null,
  onXpTransitionComplete,
  children,
}) => {
  const { displayXp, isAnimating, gainBadgeAmount } = useAnimatedXp({
    targetXp: stats.totalXp,
    transition: xpTransition,
    onTransitionComplete: onXpTransitionComplete,
  });
  const xpInfo = calculateXpProgress(displayXp);
  const currentMeta =
    NAV_ITEMS.find((item) => item.id === activeLayer) || NAV_ITEMS[0];

  return (
    <div className="min-h-screen bg-[#FAF8FA] text-[#1C1420] lg:flex">
      {/* Desktop Left Navigation Rail */}
      <aside
        aria-label="Navigasi Utama"
        className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-68 lg:shrink-0 lg:flex-col lg:justify-between lg:border-r lg:border-[#EAE3EC] lg:bg-white"
      >
        <div>
          {/* Brand Logo Header */}
          <div className="flex items-center gap-3 border-b border-[#EAE3EC] px-5 py-5">
            <img
              src="/assets/aistudio/logo_37951615.png"
              alt="Logo CAT CPNS Master"
              className="h-10 w-10 shrink-0 rounded-xl object-cover shadow-xs ring-1 ring-black/10"
            />
            <div className="min-w-0">
              <div className="truncate text-base font-extrabold tracking-tight text-[#1C1420]">
                CAT CPNS Master
              </div>
              <div className="text-[11px] font-medium text-[#6B5D73]">
                100% Offline · {counts.total} Soal
              </div>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1.5 p-3.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeLayer === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onChangeLayer(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left transition ${
                    active
                      ? 'bg-gradient-to-r from-[#5B0A2B] via-[#831843] to-[#6D28D9] text-white shadow-xs'
                      : 'text-[#4A3E52] hover:bg-rose-50/60 hover:text-[#1C1420]'
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      active ? 'text-amber-300' : 'text-[#7C6D85]'
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-bold leading-tight">
                      {item.label}
                    </div>
                    <div
                      className={`mt-0.5 text-[11px] leading-tight ${
                        active ? 'text-rose-100/85' : 'text-[#7C6D85]'
                      }`}
                    >
                      {item.subtitle}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Gamification Card in Rail */}
        <div className="border-t border-[#EAE3EC] p-4">
          <div className="rounded-xl border border-[#EAE3EC] bg-[#FAF8FA] p-3.5">
            <div className="flex items-center justify-between text-xs font-bold text-[#1C1420]">
              <span>Level {xpInfo.level} · Pejuang NIP</span>
              <span className="inline-flex items-center gap-1 text-amber-700 tabular-nums">
                <Flame className="h-3.5 w-3.5 text-amber-500" />
                {stats.currentStreak}h
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#E8DFEB]">
              <div
                className="artheo-progress h-full rounded-full transition-all duration-300"
                style={{ width: `${xpInfo.percent}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-[#6B5D73] tabular-nums">
              <span className="inline-flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-[#9D174D]" />
                {displayXp} XP
              </span>
              <span>
                {xpInfo.currentLevelXp}/{xpInfo.neededForNextLevel}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col pb-20 lg:pb-0">
        {/* Contextual Top Bar */}
        <header className="sticky top-0 z-20 border-b border-[#EAE3EC] bg-white/95 backdrop-blur-xs">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <img
                src="/assets/aistudio/logo_37951615.png"
                alt="Logo CAT CPNS Master"
                className="h-9 w-9 shrink-0 rounded-xl object-cover shadow-xs ring-1 ring-black/10 lg:hidden"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 truncate text-xs font-semibold text-[#9D174D]">
                  <Compass className="hidden h-3.5 w-3.5 shrink-0 sm:inline" />
                  <span className="truncate">CAT CPNS Master</span>
                  <span className="text-slate-300">/</span>
                  <span className="truncate text-[#6B5D73]">
                    {currentMeta.label}
                  </span>
                </div>
                <h1 className="truncate text-sm font-extrabold tracking-tight text-[#1C1420] sm:text-lg">
                  {currentMeta.label}
                  <span className="hidden font-semibold text-[#6B5D73] sm:inline">
                    {' '}
                    — {currentMeta.subtitle}
                  </span>
                </h1>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3 text-xs sm:gap-4 sm:text-sm">
              <div className="flex items-center gap-1 font-semibold whitespace-nowrap text-amber-700">
                <Flame className="h-4 w-4 shrink-0 text-amber-500" />
                <span className="tabular-nums">{stats.currentStreak}</span>
                <span className="hidden font-normal text-[#6B5D73] sm:inline">
                  Hari Streak
                </span>
              </div>
              <div className="h-4 w-px bg-[#EAE3EC]" aria-hidden="true" />
              <HeaderXpCounter
                displayXp={displayXp}
                isAnimating={isAnimating}
                gainBadgeAmount={gainBadgeAmount}
              />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-7">
          {children}
        </main>
      </div>

      {/* Mobile Sticky Bottom Navigation */}
      <nav
        aria-label="Navigasi Bawah"
        className="fixed right-0 bottom-0 left-0 z-30 border-t border-[#EAE3EC] bg-white lg:hidden"
      >
        <div className="grid grid-cols-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeLayer === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangeLayer(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-semibold transition ${
                  active
                    ? 'text-[#9D174D]'
                    : 'text-[#6B5D73] hover:text-[#1C1420]'
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${
                    active ? 'text-[#9D174D]' : 'text-[#8B7D93]'
                  }`}
                />
                <span>{item.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
