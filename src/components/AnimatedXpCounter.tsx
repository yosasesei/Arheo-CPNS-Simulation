import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { calculateXpProgress, interpolateXpValue } from '../utils/examEngine';

export interface XpTransitionState {
  id: number;
  fromXp: number;
  toXp: number;
  gainedXp: number;
}

interface UseAnimatedXpOptions {
  targetXp: number;
  transition: XpTransitionState | null;
  onTransitionComplete?: () => void;
}

export function useAnimatedXp({
  targetXp,
  transition,
  onTransitionComplete,
}: UseAnimatedXpOptions): {
  displayXp: number;
  isAnimating: boolean;
  gainBadgeAmount: number | null;
} {
  const [displayXp, setDisplayXp] = useState<number>(() =>
    transition ? transition.fromXp : targetXp
  );
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [gainBadgeAmount, setGainBadgeAmount] = useState<number | null>(null);
  const lastHandledTransitionIdRef = useRef<number | null>(null);
  const prevTargetXpRef = useRef<number>(targetXp);
  const onCompleteRef = useRef(onTransitionComplete);
  onCompleteRef.current = onTransitionComplete;

  useEffect(() => {
    // Case 1: Explicit post-exam XP transition passed from App upon returning home
    if (
      transition &&
      transition.toXp > transition.fromXp &&
      lastHandledTransitionIdRef.current !== transition.id
    ) {
      lastHandledTransitionIdRef.current = transition.id;
      prevTargetXpRef.current = transition.toXp;

      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

      if (prefersReducedMotion) {
        setDisplayXp(transition.toXp);
        setIsAnimating(false);
        setGainBadgeAmount(null);
        onCompleteRef.current?.();
        return;
      }

      const delta = transition.toXp - transition.fromXp;
      const durationMs = Math.min(1350, Math.max(850, delta * 14));
      let rafId = 0;
      let startTime: number | null = null;
      let holdTimer = 0;

      // Small delay so the user sees the initial XP and the +XP pop before digits roll up
      const startDelayTimer = window.setTimeout(() => {
        setIsAnimating(true);
        setGainBadgeAmount(transition.gainedXp);

        const step = (now: number) => {
          if (startTime === null) startTime = now;
          const elapsed = now - startTime;
          const progress = Math.min(1, elapsed / durationMs);
          setDisplayXp(
            interpolateXpValue(transition.fromXp, transition.toXp, progress)
          );

          if (progress < 1) {
            rafId = window.requestAnimationFrame(step);
          } else {
            setDisplayXp(transition.toXp);
            setIsAnimating(false);
            holdTimer = window.setTimeout(() => {
              setGainBadgeAmount(null);
              onCompleteRef.current?.();
            }, 1400);
          }
        };

        rafId = window.requestAnimationFrame(step);
      }, 120);

      setDisplayXp(transition.fromXp);

      return () => {
        window.clearTimeout(startDelayTimer);
        window.clearTimeout(holdTimer);
        if (rafId) window.cancelAnimationFrame(rafId);
      };
    }

    // Case 2: Live XP increase while AppShell is already mounted
    if (targetXp > prevTargetXpRef.current && !transition) {
      const from = prevTargetXpRef.current;
      const to = targetXp;
      prevTargetXpRef.current = to;

      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

      if (prefersReducedMotion) {
        setDisplayXp(to);
        return;
      }

      const durationMs = Math.min(1200, Math.max(700, (to - from) * 14));
      let rafId = 0;
      let startTime: number | null = null;
      let holdTimer = 0;

      setIsAnimating(true);
      setGainBadgeAmount(to - from);

      const step = (now: number) => {
        if (startTime === null) startTime = now;
        const progress = Math.min(1, (now - startTime) / durationMs);
        setDisplayXp(interpolateXpValue(from, to, progress));

        if (progress < 1) {
          rafId = window.requestAnimationFrame(step);
        } else {
          setDisplayXp(to);
          setIsAnimating(false);
          holdTimer = window.setTimeout(() => setGainBadgeAmount(null), 1300);
        }
      };

      rafId = window.requestAnimationFrame(step);

      return () => {
        window.clearTimeout(holdTimer);
        if (rafId) window.cancelAnimationFrame(rafId);
      };
    }

    prevTargetXpRef.current = targetXp;
    if (!transition) {
      setDisplayXp(targetXp);
    }
  }, [targetXp, transition]);

  return { displayXp, isAnimating, gainBadgeAmount };
}

interface HeaderXpCounterProps {
  displayXp: number;
  isAnimating: boolean;
  gainBadgeAmount: number | null;
}

export const HeaderXpCounter: React.FC<HeaderXpCounterProps> = ({
  displayXp,
  isAnimating,
  gainBadgeAmount,
}) => {
  const xpInfo = calculateXpProgress(displayXp);

  return (
    <div
      className="relative flex items-center"
      data-xp-animating={isAnimating ? 'true' : 'false'}
      data-testid="header-xp-counter"
    >
      <motion.div
        animate={
          isAnimating
            ? {
                scale: [1, 1.07, 1],
                backgroundColor: ['#FAF8FA', '#FDF2F8', '#FDF2F8'],
                borderColor: ['#EAE3EC', '#9D174D', '#F59E0B'],
              }
            : {
                scale: 1,
                backgroundColor: 'rgba(255,255,255,0)',
                borderColor: 'rgba(234,227,236,0)',
              }
        }
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="flex items-center gap-1.5 rounded-lg border px-2 py-1 font-mono text-xs font-bold whitespace-nowrap text-[#4A051D] tabular-nums"
      >
        <Sparkles
          className={`h-3.5 w-3.5 shrink-0 transition-colors duration-300 ${
            isAnimating ? 'text-amber-500' : 'text-[#9D174D]'
          }`}
        />
        <span>
          LV {xpInfo.level} · {displayXp} XP
        </span>
      </motion.div>

      <AnimatePresence>
        {gainBadgeAmount !== null && gainBadgeAmount > 0 && (
          <motion.span
            key="xp-gain-pop"
            initial={{ opacity: 0, y: 8, scale: 0.86 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.92 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            aria-live="polite"
            className="pointer-events-none absolute top-full right-0 z-30 mt-1.5 inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-gradient-to-r from-[#5B0A2B] to-[#9D174D] px-2.5 py-1 font-mono text-[11px] font-extrabold whitespace-nowrap text-amber-300 shadow-md tabular-nums"
          >
            <Sparkles className="h-3 w-3 text-amber-300" />+{gainBadgeAmount} XP
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
};
