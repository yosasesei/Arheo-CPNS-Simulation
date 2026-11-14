import type { CategoryCounts, Question } from '../types/exam';
import { countByCategory, parseQuestionBankJson } from '../utils/examEngine';

const DB_NAME = 'cat_cpns_master_db';
const DB_VERSION = 1;
const STORE_QUESTIONS = 'questions';
const STORE_META = 'meta';

const DEFAULT_BANK_URL = '/assets/aistudio/bank_soal_bf0a0327.json';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_QUESTIONS)) {
        const store = db.createObjectStore(STORE_QUESTIONS, { keyPath: 'id' });
        store.createIndex('kategori', 'kategori', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () =>
      reject(req.error || new Error('Gagal membuka IndexedDB lokal.'));
  });
}

async function countStoredQuestions(db: IDBDatabase): Promise<number> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_QUESTIONS, 'readonly');
    const store = tx.objectStore(STORE_QUESTIONS);
    const req = store.count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () =>
      reject(req.error || new Error('Gagal menghitung soal tersimpan.'));
  });
}

export async function getAllStoredQuestions(): Promise<Question[]> {
  const db = await openDatabase();
  try {
    return await new Promise<Question[]>((resolve, reject) => {
      const tx = db.transaction(STORE_QUESTIONS, 'readonly');
      const store = tx.objectStore(STORE_QUESTIONS);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as Question[]) || []);
      req.onerror = () =>
        reject(req.error || new Error('Gagal membaca bank soal dari IndexedDB.'));
    });
  } finally {
    db.close();
  }
}

export async function upsertQuestions(questions: Question[]): Promise<number> {
  if (questions.length === 0) return 0;
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([STORE_QUESTIONS, STORE_META], 'readwrite');
      const store = tx.objectStore(STORE_QUESTIONS);
      const meta = tx.objectStore(STORE_META);

      for (const q of questions) {
        store.put(q);
      }
      meta.put({ key: 'lastUpdated', value: Date.now() });

      tx.oncomplete = () => resolve();
      tx.onerror = () =>
        reject(tx.error || new Error('Gagal menyimpan soal ke database lokal.'));
    });
    return questions.length;
  } finally {
    db.close();
  }
}

/**
 * Mekanisme pre-populate otomatis:
 * Saat aplikasi pertama kali dibuka dan tabel masih kosong,
 * baca bank_soal JSON lokal lalu simpan seluruh soal ke IndexedDB.
 */
export async function ensurePrepopulatedQuestionBank(): Promise<{
  questions: Question[];
  counts: CategoryCounts;
  seededNow: boolean;
}> {
  const db = await openDatabase();
  let existingCount = 0;
  try {
    existingCount = await countStoredQuestions(db);
  } finally {
    db.close();
  }

  if (existingCount > 0) {
    const questions = await getAllStoredQuestions();
    return {
      questions,
      counts: countByCategory(questions),
      seededNow: false,
    };
  }

  const response = await fetch(DEFAULT_BANK_URL);
  if (!response.ok) {
    throw new Error(
      `Gagal memuat bank soal bawaan (status ${response.status}).`
    );
  }
  const rawJson: unknown = await response.json();
  const parsed = parseQuestionBankJson(rawJson);
  await upsertQuestions(parsed);

  const questions = await getAllStoredQuestions();
  return {
    questions,
    counts: countByCategory(questions),
    seededNow: true,
  };
}

export async function importQuestionPackageFile(file: File): Promise<{
  importedCount: number;
  questions: Question[];
  counts: CategoryCounts;
}> {
  const text = await file.text();
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(text);
  } catch {
    throw new Error('File bukan format JSON yang valid.');
  }
  const parsedQuestions = parseQuestionBankJson(parsedJson);
  await upsertQuestions(parsedQuestions);
  const questions = await getAllStoredQuestions();
  return {
    importedCount: parsedQuestions.length,
    questions,
    counts: countByCategory(questions),
  };
}
