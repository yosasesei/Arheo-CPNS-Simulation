import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  applyAnswerToSession,
  computeCategoryMastery,
  computeLast7DaysXpProgress,
  computeNextStreak,
  computeSubtestDistribution,
  countByCategory,
  evaluateExamSubmission,
  formatCountdown,
  interpolateXpValue,
  parseQuestionBankJson,
  selectDrillQuestions,
  selectExamQuestions,
  updateQuestionAttemptStats,
} from './examEngine';
import { KISI_KISI_SKD, mapKisiToBankCoverage } from './kisiKisiData';
import type { ActiveExamSession, Question, UserStats } from '../types/exam';

function createDeterministicRng(seed = 42): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

describe('examEngine', () => {
  it('parses the attached 858-question bank_soal JSON cleanly including wacana, is_hots, and bobot_nilai', () => {
    const filePath = path.resolve(
      process.cwd(),
      'public/assets/aistudio/bank_soal_bf0a0327.json'
    );
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const questions = parseQuestionBankJson(raw);

    assert.equal(questions.length, 858);
    const counts = countByCategory(questions);
    assert.equal(counts.TWK, 301);
    assert.equal(counts.TIU, 441);
    assert.equal(counts.TKP, 116);

    const wacanaItem = questions.find((q) => q.wacana && q.wacana.length > 50);
    assert.ok(wacanaItem, 'Expected at least one TIU wacana item');
    assert.equal(wacanaItem.isHots, true);

    const tkpItem = questions.find((q) => q.kategori === 'TKP');
    assert.ok(tkpItem);
    const weights = Object.values(tkpItem.bobotNilai).sort((a, b) => a - b);
    assert.deepEqual(weights, [1, 2, 3, 4, 5]);
  });

  it('also parses flat Android QuestionEntity JSON arrays for manual import compatibility', () => {
    const flatPayload = [
      {
        id: 'TWK-901',
        category: 'TWK',
        subCategory: 'UUD 1945',
        question: 'Pasal 1 ayat 3 UUD 1945 menyatakan Indonesia adalah negara?',
        optionA: 'Hukum',
        optionB: 'Kesatuan',
        optionC: 'Republik',
        optionD: 'Serikat',
        optionE: 'Maritim',
        scoreA: 5,
        scoreB: 0,
        scoreC: 0,
        scoreD: 0,
        scoreE: 0,
        correctAnswer: 'A',
        explanation: 'Pasal 1 ayat (3) berbunyi Negara Indonesia adalah negara hukum.',
      },
    ];
    const parsed = parseQuestionBankJson(flatPayload);
    assert.equal(parsed.length, 1);
    assert.equal(parsed[0].id, 'TWK-901');
    assert.equal(parsed[0].kategori, 'TWK');
    assert.equal(parsed[0].bobotNilai.A, 5);
  });

  it('selects exactly 30 TWK, 35 TIU, 45 TKP for CAT_BKN and 15 questions for ARCADE', () => {
    const filePath = path.resolve(
      process.cwd(),
      'public/assets/aistudio/bank_soal_bf0a0327.json'
    );
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const all = parseQuestionBankJson(raw);

    const catSelection = selectExamQuestions(all, 'CAT_BKN', createDeterministicRng(7));
    assert.equal(catSelection.length, 110);
    const counts = countByCategory(catSelection);
    assert.equal(counts.TWK, 30);
    assert.equal(counts.TIU, 35);
    assert.equal(counts.TKP, 45);
    assert.equal(new Set(catSelection.map((q) => q.id)).size, 110);

    const arcadeSelection = selectExamQuestions(all, 'ARCADE', createDeterministicRng(9));
    assert.equal(arcadeSelection.length, 15);
    assert.equal(new Set(arcadeSelection.map((q) => q.id)).size, 15);
  });

  it('evaluates official passing grades (TWK 65, TIU 80, TKP 166) and unlocks badges accurately', () => {
    const filePath = path.resolve(
      process.cwd(),
      'public/assets/aistudio/bank_soal_bf0a0327.json'
    );
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const all = parseQuestionBankJson(raw);
    const examQuestions = selectExamQuestions(all, 'CAT_BKN', createDeterministicRng(11));

    const answers: Record<string, 'A' | 'B' | 'C' | 'D' | 'E'> = {};
    for (const q of examQuestions) {
      answers[q.id] = q.kunciJawaban;
    }

    const session: ActiveExamSession = {
      sessionId: 'TEST-1',
      mode: 'CAT_BKN',
      questionIds: examQuestions.map((q) => q.id),
      currentIndex: 0,
      answers,
      doubtfulIds: [],
      remainingSeconds: 1200,
      totalSeconds: 6000,
      arcadeCombo: 0,
      arcadeMaxCombo: 0,
      arcadeBonusXp: 0,
      lastAnsweredQuestionId: null,
      startedAt: Date.now() - 4800000,
    };

    const prevStats: UserStats = {
      totalXp: 0,
      level: 1,
      currentStreak: 0,
      lastPracticeDate: null,
      unlockedBadges: [],
    };

    const { result, nextStats } = evaluateExamSubmission({
      session,
      questions: examQuestions,
      prevStats,
      now: new Date('2026-05-01T10:00:00'),
    });

    assert.equal(result.twk.score, 150);
    assert.equal(result.tiu.score, 175);
    assert.equal(result.tkp.score, 225);
    assert.equal(result.passedAll, true);
    assert.ok(nextStats.unlockedBadges.includes('Lulus PG Pertama'));
    assert.ok(nextStats.unlockedBadges.includes('Master TWK'));
    assert.ok(nextStats.unlockedBadges.includes('Kilat TIU'));
    assert.ok(nextStats.unlockedBadges.includes('Bijak TKP'));
    assert.equal(nextStats.currentStreak, 1);
  });

  it('tracks Arcade combo streak XP and resets on wrong answer', () => {
    const q1: Question = {
      id: 'TWK-1',
      numericId: 1,
      kategori: 'TWK',
      subtes: 'Pancasila',
      isHots: false,
      sumber: 'Test',
      wacana: null,
      pertanyaan: 'Q1',
      pilihan: { A: 'a', B: 'b', C: 'c', D: 'd', E: 'e' },
      bobotNilai: { A: 5, B: 0, C: 0, D: 0, E: 0 },
      kunciJawaban: 'A',
      pembahasan: 'A',
    };
    const q2: Question = { ...q1, id: 'TWK-2', numericId: 2, kunciJawaban: 'B', bobotNilai: { A: 0, B: 5, C: 0, D: 0, E: 0 } };
    const q3: Question = { ...q1, id: 'TWK-3', numericId: 3, kunciJawaban: 'C', bobotNilai: { A: 0, B: 0, C: 5, D: 0, E: 0 } };

    let session: ActiveExamSession = {
      sessionId: 'ARC-1',
      mode: 'ARCADE',
      questionIds: ['TWK-1', 'TWK-2', 'TWK-3'],
      currentIndex: 0,
      answers: {},
      doubtfulIds: [],
      remainingSeconds: 300,
      totalSeconds: 300,
      arcadeCombo: 0,
      arcadeMaxCombo: 0,
      arcadeBonusXp: 0,
      lastAnsweredQuestionId: null,
      startedAt: Date.now(),
    };

    session = applyAnswerToSession(session, q1, 'A').nextSession;
    assert.equal(session.arcadeCombo, 1);
    assert.equal(session.arcadeBonusXp, 5);

    session = applyAnswerToSession(session, q2, 'B').nextSession;
    assert.equal(session.arcadeCombo, 2);
    assert.equal(session.arcadeBonusXp, 15);

    session = applyAnswerToSession(session, q3, 'A').nextSession;
    assert.equal(session.arcadeCombo, 0);
    assert.equal(session.arcadeMaxCombo, 2);
  });

  it('computes daily streak and formats countdown timers correctly', () => {
    assert.deepEqual(computeNextStreak(3, '2026-05-01', '2026-05-02'), {
      currentStreak: 4,
      lastPracticeDate: '2026-05-02',
    });
    assert.deepEqual(computeNextStreak(3, '2026-05-01', '2026-05-01'), {
      currentStreak: 3,
      lastPracticeDate: '2026-05-01',
    });
    assert.deepEqual(computeNextStreak(3, '2026-05-01', '2026-05-04'), {
      currentStreak: 1,
      lastPracticeDate: '2026-05-04',
    });
    assert.equal(formatCountdown(6000), '01:40:00');
    assert.equal(formatCountdown(299), '04:59');
    assert.equal(formatCountdown(0), '00:00');
  });

  it('computes subtest analytics, user attempt mastery, targeted drills, and Kisi-kisi bank coverage', () => {
    const filePath = path.resolve(
      process.cwd(),
      'public/assets/aistudio/bank_soal_bf0a0327.json'
    );
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const all = parseQuestionBankJson(raw);

    const hotsDrill = selectDrillQuestions(
      all,
      { label: 'Latihan HOTS', hotsOnly: true, count: 10 },
      createDeterministicRng(19)
    );
    assert.equal(hotsDrill.length, 10);
    assert.ok(hotsDrill.every((q) => q.isHots));

    const pancasilaDrill = selectDrillQuestions(
      all,
      { label: 'Pancasila', category: 'TWK', subtes: 'Pancasila', count: 8 },
      createDeterministicRng(23)
    );
    assert.equal(pancasilaDrill.length, 8);
    assert.ok(pancasilaDrill.every((q) => q.subtes === 'Pancasila'));

    const answers: Record<string, 'A' | 'B' | 'C' | 'D' | 'E'> = {};
    for (const q of pancasilaDrill) {
      answers[q.id] = q.kunciJawaban;
    }
    const updatedStats = updateQuestionAttemptStats({}, pancasilaDrill, answers);
    const dist = computeSubtestDistribution(all, updatedStats);
    const pancasilaRow = dist.find((d) => d.subtes === 'Pancasila');
    assert.ok(pancasilaRow);
    assert.equal(pancasilaRow.totalQuestions, 22);
    assert.equal(pancasilaRow.attemptedQuestions, 8);
    assert.equal(pancasilaRow.accuracyPercent, 100);

    const mastery = computeCategoryMastery(all, updatedStats);
    assert.equal(mastery.TWK.accuracyPercent, 100);
    assert.equal(mastery.TIU.accuracyPercent, null);

    const coverage = mapKisiToBankCoverage(KISI_KISI_SKD, all);
    assert.equal(coverage.length, KISI_KISI_SKD.length);
    assert.ok(coverage.every((c) => c.matchingQuestionCount > 0));
  });

  it('aggregates XP progress across the last 7 local days accurately', () => {
    const now = new Date(2026, 10, 14, 15, 30, 0); // 14 Nov 2026 local
    const makeHistory = (
      id: string,
      year: number,
      monthZeroIdx: number,
      day: number,
      hour: number,
      xpEarned: number
    ) => ({
      id,
      mode: 'ARCADE' as const,
      timestamp: new Date(year, monthZeroIdx, day, hour, 0, 0).getTime(),
      durationUsedSeconds: 120,
      twkScore: 10,
      tiuScore: 15,
      tkpScore: 20,
      totalScore: 45,
      passedAll: true,
      xpEarned,
      maxCombo: 3,
      totalQuestions: 15,
      answeredCount: 15,
    });

    const history = [
      makeHistory('H-TODAY-1', 2026, 10, 14, 9, 45),
      makeHistory('H-TODAY-2', 2026, 10, 14, 14, 30),
      makeHistory('H-2D', 2026, 10, 12, 18, 60),
      makeHistory('H-6D', 2026, 10, 8, 10, 25),
      makeHistory('H-OLD', 2026, 10, 7, 23, 999), // 7 hari lalu -> di luar rentang 7 hari terakhir
    ];

    const points = computeLast7DaysXpProgress(history, now);
    assert.equal(points.length, 7);
    assert.equal(points[0].dateKey, '2026-11-08');
    assert.equal(points[0].xp, 25);
    assert.equal(points[0].sessions, 1);
    assert.equal(points[0].isToday, false);

    assert.equal(points[1].xp, 0);
    assert.equal(points[1].sessions, 0);

    assert.equal(points[4].dateKey, '2026-11-12');
    assert.equal(points[4].xp, 60);

    assert.equal(points[6].dateKey, '2026-11-14');
    assert.equal(points[6].shortDay, 'Hari Ini');
    assert.equal(points[6].xp, 75);
    assert.equal(points[6].sessions, 2);
    assert.equal(points[6].isToday, true);
  });

  it('interpolates XP count-up monotonically with ease-out curve', () => {
    assert.equal(interpolateXpValue(120, 220, 0), 120);
    assert.equal(interpolateXpValue(120, 220, -0.2), 120);
    const quarter = interpolateXpValue(120, 220, 0.25);
    const half = interpolateXpValue(120, 220, 0.5);
    const threeQuarter = interpolateXpValue(120, 220, 0.75);
    assert.ok(quarter > 120 && quarter < half);
    assert.ok(half > 170); // ease-out advances faster early on
    assert.ok(threeQuarter > half && threeQuarter < 220);
    assert.equal(interpolateXpValue(120, 220, 1), 220);
    assert.equal(interpolateXpValue(120, 220, 1.5), 220);
  });
});
