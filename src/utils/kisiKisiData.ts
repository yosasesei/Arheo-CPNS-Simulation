import type { KisiKisiTopic, Question } from '../types/exam';

export const KISI_KISI_SKD: KisiKisiTopic[] = [
  // TWK
  {
    id: 'twk-pancasila',
    kategori: 'TWK',
    judul: 'Pancasila & Ideologi Negara',
    indikator:
      'Memahami sejarah perumusan Pancasila, kedudukan sebagai dasar negara & pandangan hidup, serta pengamalan butir-butir sila dalam kasus nyata ASN.',
    strategi:
      'Fokus pada studi kasus penerapan sila ke-1 hingga ke-5 dan beda antara nilai dasar, instrumental, serta praksis.',
    targetSubtes: ['Pancasila', 'Tes Wawasan Kebangsaan CAT'],
    keywords: ['pancasila', 'sila', 'bpupki', 'ppki', 'piagam jakarta', 'ideologi'],
  },
  {
    id: 'twk-uud-konstitusi',
    kategori: 'TWK',
    judul: 'UUD 1945 & Sistem Ketatanegaraan',
    indikator:
      'Menguasai struktur Pembukaan UUD 1945, pasal-pasal kunci, amandemen I–IV, tugas lembaga negara (MPR, DPR, DPD, Presiden, MK, MA, BPK), dan tata perundang-undangan.',
    strategi:
      'Pahami perubahan wewenang lembaga pasca-amandemen dan hierarki peraturan UU No. 12 Tahun 2011.',
    targetSubtes: ['UUD 1945 dan Tata Perundang-undangan RI', 'Konstitusi RI'],
    keywords: ['uud', 'pasal', 'amandemen', 'konstitusi', 'mpr', 'dpr', 'mahkamah'],
  },
  {
    id: 'twk-nkri-otda',
    kategori: 'TWK',
    judul: 'NKRI, Bela Negara & Otonomi Daerah',
    indikator:
      'Mampu menganalisis konsep wawasan nusantara, ketahanan nasional, kewenangan pemerintah pusat vs daerah, dan sikap bela negara menghadapi ancaman non-militer.',
    strategi:
      'Bedakan urusan absolut pemerintah pusat (politik luar negeri, pertahanan, keamanan, yustisi, moneter, agama) dari urusan konkuren daerah.',
    targetSubtes: ['NKRI', 'Otonomi Daerah'],
    keywords: ['nkri', 'otonomi', 'bela negara', 'daerah', 'wawasan nusantara'],
  },
  {
    id: 'twk-bhinneka-sejarah',
    kategori: 'TWK',
    judul: 'Bhinneka Tunggal Ika, Integritas & Sejarah',
    indikator:
      'Mengimplementasikan toleransi keberagaman, nasionalisme, integritas antikorupsi, serta memahami tonggak pergerakan nasional hingga kemerdekaan.',
    strategi:
      'Pada soal HOTS TWK, pilih jawaban yang menunjukkan ketegasan konstitusional sekaligus menjaga persatuan bangsa.',
    targetSubtes: ['Bhinneka Tunggal Ika', 'Sejarah Indonesia'],
    keywords: ['bhinneka', 'sejarah', 'kemerdekaan', 'sumpah pemuda', 'integritas', 'nasionalisme'],
  },

  // TIU
  {
    id: 'tiu-verbal-analogi',
    kategori: 'TIU',
    judul: 'Verbal: Analogi, Sinonim & Antonim',
    indikator:
      'Mengukur kecakapan menalar hubungan kesetaraan makna kata, padanan konsep, lawan kata, dan hubungan sebab-akibat/fungsi antar istilah.',
    strategi:
      'Buat kalimat penghubung yang tepat di antara pasangan kata soal sebelum menguji opsi A–E.',
    targetSubtes: ['Analogi', 'Sinonim', 'Antonim', 'Tes Inteligensi Umum CAT'],
    keywords: ['analogi', 'sinonim', 'antonim', 'padanan', 'lawan kata'],
  },
  {
    id: 'tiu-verbal-wacana-logis',
    kategori: 'TIU',
    judul: 'Penalaran Logis, Analitis & Pemahaman Wacana',
    indikator:
      'Menarik kesimpulan sahih dari premis silogisme, menyusun urutan/jadwal analitis, serta menangkap ide pokok dan hubungan sebab-akibat pada wacana panjang.',
    strategi:
      'Baca pertanyaan wacana terlebih dahulu sebelum memindai paragraf agar lebih hemat waktu saat ujian CAT.',
    targetSubtes: ['Pemahaman Wacana', 'Penalaran Logis & Analitis'],
    keywords: ['wacana', 'kesimpulan', 'semua', 'sebagian', 'jika', 'maka', 'silogisme'],
  },
  {
    id: 'tiu-numerik-deret',
    kategori: 'TIU',
    judul: 'Numerik: Deret Bilangan & Deret Huruf',
    indikator:
      'Menemukan pola operasi aritmetika, loncatan bertingkat, pola selang-seling, maupun konversi urutan alfabet.',
    strategi:
      'Cek selisih antar suku berdekatan terlebih dahulu; jika tidak teratur, periksa pola loncat 1 atau loncat 2 suku.',
    targetSubtes: ['Deret Bilangan', 'Deret Huruf', 'Deret Bilangan & Huruf'],
    keywords: ['deret', 'pola', 'lanjutkan', 'huruf', 'bilangan'],
  },
  {
    id: 'tiu-numerik-aritmetika',
    kategori: 'TIU',
    judul: 'Numerik: Berhitung Cepat & Aritmetika Sosial',
    indikator:
      'Menyelesaikan operasi pecahan, persentase, perbandingan senilai/berbalik nilai, kecepatan-jarak-waktu, keuntungan/diskon, serta analisis data tabel.',
    strategi:
      'Gunakan pendekatan angka bulat atau perbandingan proporsi untuk mempercepat hitungan tanpa kalkulator.',
    targetSubtes: ['Aritmetika & Numerik', 'Aritmetika Sosial'],
    keywords: ['persen', 'harga', 'kecepatan', 'perbandingan', 'rata-rata', 'untung', 'rugi'],
  },

  // TKP
  {
    id: 'tkp-pelayanan-jejaring',
    kategori: 'TKP',
    judul: 'Pelayanan Publik & Jejaring Kerja',
    indikator:
      'Menampilkan sikap ramah, cekatan, solutif tanpa diskriminasi kepada masyarakat, serta mampu membangun sinergi lintas tim/instansi.',
    strategi:
      'Selalu prioritaskan kepuasan layanan sesuai SOP dan kolaborasi aktif untuk skor maksimal (5).',
    targetSubtes: ['Tes Karakteristik Pribadi CAT', 'Tes Skala Kematangan Pribadi'],
    keywords: ['pelayanan', 'masyarakat', 'rekan', 'tim', 'kerja sama', 'atasan', 'klien'],
  },
  {
    id: 'tkp-profesionalisme-tik',
    kategori: 'TKP',
    judul: 'Profesionalisme, TIK & Adaptasi Kerja',
    indikator:
      'Menjaga integritas dan target kerja di bawah tekanan, menguasai pemanfaatan teknologi digital pemerintahan, serta sigap belajar hal baru.',
    strategi:
      'Pilih opsi yang bertanggung jawab penuh pada tugas, tidak melempar masalah, dan memanfaatkan sistem teknologi secara etis.',
    targetSubtes: ['Tes Karakteristik Pribadi CAT', 'Tes Skala Kematangan Pribadi'],
    keywords: ['aplikasi', 'sistem', 'teknologi', 'tugas', 'deadline', 'profesional', 'komputer'],
  },
  {
    id: 'tkp-sosbud-antiradikalisme',
    kategori: 'TKP',
    judul: 'Sosial Budaya & Anti Radikalisme',
    indikator:
      'Mampu beradaptasi di lingkungan kerja majemuk, menghargai kearifan lokal, dan bersikap tegas menolak paham intoleransi maupun radikalisme.',
    strategi:
      'Hindari sikap pasif/apatis atau main hakim sendiri; pilih dialog persuasif, pelaporan resmi, dan penghormatan keberagaman.',
    targetSubtes: ['Tes Karakteristik Pribadi CAT', 'Tes Skala Kematangan Pribadi'],
    keywords: ['budaya', 'adat', 'agama', 'toleransi', 'radikal', 'konflik', 'lingkungan'],
  },
];

export interface KisiCoverageStats {
  topic: KisiKisiTopic;
  matchingQuestionCount: number;
  hotsCount: number;
}

export function mapKisiToBankCoverage(
  topics: readonly KisiKisiTopic[],
  questions: readonly Question[]
): KisiCoverageStats[] {
  return topics.map((topic) => {
    const subtesSet = new Set(topic.targetSubtes.map((s) => s.toLowerCase()));
    const matches = questions.filter((q) => {
      if (q.kategori !== topic.kategori) return false;
      if (subtesSet.has(q.subtes.toLowerCase())) return true;
      const haystack = `${q.subtes} ${q.pertanyaan}`.toLowerCase();
      return topic.keywords.some((kw) => haystack.includes(kw));
    });
    return {
      topic,
      matchingQuestionCount: matches.length,
      hotsCount: matches.filter((q) => q.isHots).length,
    };
  });
}
