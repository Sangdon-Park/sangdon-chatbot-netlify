const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');
const { getCachedEmbedding, setCachedEmbedding } = require('./embeddings-cache');
const {
  SITE_PROFILE,
  SITE_LINKS,
  COURSES_2026_SPRING,
  NEWS_POSTS,
  PUBLICATION_STATS,
  PUBLICATIONS
} = require('./knowledge-base');

const GEMINI_MODEL = 'gemini-2.5-flash';
const EMBEDDING_MODEL = 'text-embedding-004';
const MAX_HISTORY = 10;
const MAX_RESULTS = 5;
const MAX_RETRIEVED = 6;
const MAX_CONTEXT_TEXT_CHARS = 420;
const COURSE_FACT_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const COURSE_FACT_CACHE = new Map();
const HOMEPAGE_SNAPSHOT_TTL_MS = 30 * 60 * 1000;
const HOMEPAGE_SNAPSHOT_CACHE = { updatedAt: 0, docs: [] };
const MAX_CHUNK_LEN = 900;
const CHUNK_OVERLAP = 150;

function tr(lang, ko, en) {
  return lang === 'ko' ? ko : en;
}

function containsHangul(text = '') {
  return /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(String(text));
}

function detectLanguage(message = '', history = []) {
  if (containsHangul(message)) return 'ko';
  for (let i = history.length - 1; i >= 0; i -= 1) {
    if (containsHangul(history[i]?.content || '')) return 'ko';
  }
  return 'en';
}

function normalize(text = '') {
  return String(text).replace(/\s+/g, ' ').trim().toLowerCase();
}

function normalizeForMatch(text = '') {
  return normalize(text).replace(/[^a-z0-9가-힣\s]/g, ' ');
}

function tokenize(text = '') {
  return normalizeForMatch(text)
    .split(/\s+/)
    .map((v) => v.trim())
    .filter(Boolean)
    .filter((v) => v.length > 1);
}

function safeHistory(history = []) {
  return Array.isArray(history) ? history.slice(-MAX_HISTORY) : [];
}

function isGreeting(message = '') {
  const compact = normalize(message).replace(/\s+/g, '');
  if (!compact) return false;
  if (/^(hello|hi|hey|goodmorning|goodafternoon|goodevening)$/i.test(compact)) return true;
  if (/^(g2|h2|yo|yoo|hii+)$/i.test(compact)) return true;
  if (/^(안녕|안녕하세요|ㅎㅇ|하이|헬로)$/.test(compact)) return true;
  if (/^ㅎ+[a-z0-9]*$/.test(compact)) return true;
  if (/^안녕[a-z0-9]*$/.test(compact)) return true;
  return false;
}

function isContactIntent(text = '') {
  return /(연락|이메일|문의|메일|email|contact|reach)/i.test(text);
}

function isLinkIntent(text = '') {
  return /(사이트|주소|홈페이지|웹사이트|링크|url|website|site|link|homepage)/i.test(text);
}

function isCourseIntent(text = '') {
  return /(수업|강의|과목|가르치|이번\s*학기|데이터베이스|인공지능|캡스톤|course|class|lecture|teach|teaching|database|db|capstone|ai)/i.test(text);
}

function isExamIntent(text = '') {
  return /(중간|기말|시험|범위|출제|midterm|final|exam|coverage|scope)/i.test(text);
}

function isGradingIntent(text = '') {
  return /(점수|배점|비율|평가|채점|grading|score|scores|weight|weights|rubric|evaluation)/i.test(text);
}

function isTextbookIntent(text = '') {
  return /(교재|책|textbook|book|reference book)/i.test(text);
}

function isFollowupCourseIntent(text = '') {
  return /(그럼|그건|그거|이번엔|그 과목|해당 과목|그 수업|범위|배점|중간|기말|시험|과제|교재|공지|syllabus|assignment|quiz|midterm|final)/i.test(text);
}

function isPublicationIntent(text = '') {
  return /(논문|저널|학술|publication|paper|journal|doi|ieee|scholar)/i.test(text);
}

function isProfileIntent(text = '') {
  return /(누구|소개|약력|학력|경력|소속|직위|연구|무슨\s*일|who are you|profile|bio|about|cv)/i.test(text);
}

function isBeforeThatIntent(text = '') {
  return /(그전|그 전|이전|전에는|before that|before|prior)/i.test(text);
}

function findCourseInText(text = '') {
  const msg = String(text || '');

  if (/(데이터베이스|db\s*시스템|db시스템|database|db systems?)/i.test(msg)) {
    return (COURSES_2026_SPRING || []).find((c) => c.code === 'DB Systems') || null;
  }
  if (/(인공지능|artificial intelligence|\bai\b)/i.test(msg)) {
    return (COURSES_2026_SPRING || []).find((c) => c.code === 'AI') || null;
  }
  if (/(캡스톤|capstone)/i.test(msg)) {
    return (COURSES_2026_SPRING || []).find((c) => c.code === 'Capstone') || null;
  }

  return null;
}

function findCourseFromHistory(history = []) {
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const c = findCourseInText(history[i]?.content || '');
    if (c) return c;
  }
  return null;
}

function expandQueryWithHistory(query = '', history = []) {
  const q = String(query || '').trim();
  if (!q) return q;

  const queryCourse = findCourseInText(q);
  if (queryCourse) return q;

  if (isCourseIntent(q) || isExamIntent(q) || isGradingIntent(q) || isFollowupCourseIntent(q)) {
    const historyCourse = findCourseFromHistory(history);
    if (historyCourse) {
      return `${q} ${historyCourse.titleKo} ${historyCourse.titleEn}`;
    }
  }

  return q;
}

function decodeEntities(text = '') {
  return String(text)
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/g, '\'')
    .replace(/&quot;/g, '"');
}

function stripHtml(raw = '') {
  return decodeEntities(
    String(raw)
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/\s+/g, ' ')
    .trim();
}

function extractPageTitle(html = '') {
  return pickFirstMatch(String(html), [/<title[^>]*>([\s\S]*?)<\/title>/i]) || 'Untitled';
}

function extractMainText(html = '') {
  const input = String(html || '');
  const withoutScripts = input
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ');
  const mainMatch = withoutScripts.match(/<main[\s\S]*?<\/main>/i);
  const root = mainMatch ? mainMatch[0] : withoutScripts;
  return stripHtml(root);
}

function chunkText(text = '', size = MAX_CHUNK_LEN, overlap = CHUNK_OVERLAP) {
  const clean = String(text || '').trim();
  if (!clean) return [];
  if (clean.length <= size) return [clean];

  const chunks = [];
  let start = 0;
  while (start < clean.length) {
    let end = Math.min(start + size, clean.length);
    if (end < clean.length) {
      const lastSpace = clean.lastIndexOf(' ', end);
      if (lastSpace > start + Math.floor(size * 0.6)) {
        end = lastSpace;
      }
    }

    const part = clean.slice(start, end).trim();
    if (part) chunks.push(part);
    if (end >= clean.length) break;
    start = Math.max(0, end - overlap);
  }
  return chunks;
}

function buildHomepageSourceUrls() {
  const urls = new Set([
    SITE_LINKS.homeKo,
    SITE_LINKS.homeEn,
    SITE_LINKS.aboutKo,
    SITE_LINKS.aboutEn,
    SITE_LINKS.publications,
    SITE_LINKS.coursesHubKo,
    SITE_LINKS.coursesHubEn,
    SITE_LINKS.collaborationKo,
    SITE_LINKS.collaborationEn
  ]);

  for (const c of COURSES_2026_SPRING || []) {
    if (c.pageKo) urls.add(c.pageKo);
    if (c.pageEn) urls.add(c.pageEn);
  }
  for (const post of NEWS_POSTS || []) {
    if (post.url) urls.add(post.url);
  }

  return Array.from(urls).filter(Boolean);
}

async function fetchHomepageSnapshotDocs() {
  if (HOMEPAGE_SNAPSHOT_CACHE.docs.length > 0 && Date.now() - HOMEPAGE_SNAPSHOT_CACHE.updatedAt < HOMEPAGE_SNAPSHOT_TTL_MS) {
    return HOMEPAGE_SNAPSHOT_CACHE.docs;
  }

  const urls = buildHomepageSourceUrls();
  const docs = [];

  const pages = await Promise.all(urls.map(async (url) => {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'SangdonChatbot/1.0' } });
      if (!res.ok) return null;
      const html = await res.text();
      return { url, html };
    } catch (error) {
      console.error(`homepage fetch error (${url}):`, error?.message || error);
      return null;
    }
  }));

  for (const page of pages) {
    if (!page?.html) continue;
    const title = extractPageTitle(page.html);
    const text = extractMainText(page.html);
    const chunks = chunkText(text);
    chunks.slice(0, 14).forEach((chunk, idx) => {
      docs.push({
        id: `site-${normalize(page.url)}-${idx}`,
        type: 'site',
        title: `${title}#${idx + 1}`,
        text: chunk,
        url: page.url,
        year: 2026
      });
    });
  }

  HOMEPAGE_SNAPSHOT_CACHE.updatedAt = Date.now();
  HOMEPAGE_SNAPSHOT_CACHE.docs = docs;
  return docs;
}

function extractGradingSummaryFromHtml(html = '') {
  const tablePattern = /<table[^>]*class=["'][^"']*course-table[^"']*["'][^>]*>[\s\S]*?<\/table>/gi;
  const tables = String(html).match(tablePattern) || [];

  for (const table of tables) {
    if (!/(평가 항목|배점|비율|grading|evaluation|weight|score|component)/i.test(table)) {
      continue;
    }

    const rows = table.match(/<tr[\s\S]*?<\/tr>/gi) || [];
    const normalizedRows = [];

    for (const row of rows) {
      const cells = [];
      row.replace(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi, (_, cell) => {
        cells.push(stripHtml(cell));
        return '';
      });

      if (cells.length < 2) continue;
      const item = cells[0];
      const weight = cells[1];
      if (!item || !weight) continue;

      const isHeaderRow =
        /^(평가 항목|항목|item|category|component)$/i.test(item) ||
        /^(배점|비율|weight|score)$/i.test(weight);

      if (isHeaderRow) continue;

      if (!/(중간|기말|퀴즈|과제|출석|프로젝트|시험|midterm|final|quiz|assignment|attendance|project|exam|deliverable|presentation|team)/i.test(item)) {
        continue;
      }

      normalizedRows.push({ item, weight });
    }

    if (normalizedRows.length > 0) {
      return normalizedRows
        .slice(0, 8)
        .map((row) => `${row.item} ${row.weight}`)
        .join(' · ');
    }
  }

  return null;
}

function extractChapterNumbers(topic = '') {
  const text = String(topic || '');
  const nums = [];

  const chMatches = text.matchAll(/(?:ch(?:apter)?\s*)(\d{1,2})/gi);
  for (const m of chMatches) {
    const n = Number(m[1]);
    if (Number.isFinite(n)) nums.push(n);
  }

  const chapterKoMatches = text.matchAll(/(\d{1,2})\s*장/g);
  for (const m of chapterKoMatches) {
    const n = Number(m[1]);
    if (Number.isFinite(n)) nums.push(n);
  }

  return nums;
}

function toChapterRange(min, max) {
  const a = String(min).padStart(2, '0');
  const b = String(max).padStart(2, '0');
  return `CHAPTER ${a}~${b}`;
}

function deriveCoverageFromScheduleTable(html = '') {
  const tables = String(html).match(/<table[^>]*class=["'][^"']*course-table[^"']*["'][^>]*>[\s\S]*?<\/table>/gi) || [];

  for (const table of tables) {
    if (!/(주차|week)/i.test(table) || !/(주제|topic)/i.test(table)) continue;

    const rows = table.match(/<tr[\s\S]*?<\/tr>/gi) || [];
    const parsedRows = [];
    for (const row of rows) {
      const cells = [];
      row.replace(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi, (_, cell) => {
        cells.push(stripHtml(cell));
        return '';
      });
      if (cells.length < 2) continue;
      parsedRows.push({
        week: cells[0],
        topic: cells[1]
      });
    }

    const midtermIndex = parsedRows.findIndex((r) => /(중간고사|midterm)/i.test(r.topic));
    const finalIndex = parsedRows.findIndex((r) => /(기말고사|final)/i.test(r.topic));

    const result = { midtermCoverage: null, finalCoverage: null };

    if (midtermIndex > 0) {
      const nums = parsedRows
        .slice(0, midtermIndex)
        .flatMap((r) => extractChapterNumbers(r.topic));
      if (nums.length > 0) {
        result.midtermCoverage = toChapterRange(Math.min(...nums), Math.max(...nums));
      }
    }

    if (midtermIndex >= 0 && finalIndex > midtermIndex) {
      const nums = parsedRows
        .slice(midtermIndex + 1, finalIndex)
        .flatMap((r) => extractChapterNumbers(r.topic));
      if (nums.length > 0) {
        result.finalCoverage = toChapterRange(Math.min(...nums), Math.max(...nums));
      }
    }

    if (result.midtermCoverage || result.finalCoverage) {
      return result;
    }
  }

  return { midtermCoverage: null, finalCoverage: null };
}

function pickFirstMatch(text = '', patterns = []) {
  for (const pattern of patterns) {
    const m = String(text).match(pattern);
    if (m && m[1]) return cleanExtractedSnippet(m[1]);
  }
  return null;
}

function cleanExtractedSnippet(value = '') {
  let out = decodeEntities(String(value || ''))
    .replace(/\s+/g, ' ')
    .trim();

  const cutTokens = [
    '실습 코드',
    '동기화 기준',
    '교재 정보',
    '강의자료',
    '공지',
    'Lecture Materials',
    'Announcements',
    'Page:',
    'TOP const',
    'const sidebar',
    'document.getElementById'
  ];

  for (const token of cutTokens) {
    const idx = out.indexOf(token);
    if (idx > 0) {
      out = out.slice(0, idx).trim();
    }
  }

  if (out.length > 180) {
    out = out.slice(0, 180).trim();
  }

  return out;
}

function extractCourseFactsFromText(text = '') {
  const plain = String(text || '');

  const midtermCoverage = pickFirstMatch(plain, [
    /중간고사\s*\(([^)]+)\)/i,
    /중간고사[^.\n]{0,120}?범위[:\s]*([^.\n]+)/i,
    /Midterm[^.\n]{0,120}?\(([^)]+)\)/i,
    /Midterm[^.\n]{0,120}?Coverage[:\s]*([^.\n]+)/i
  ]);

  const finalCoverage = pickFirstMatch(plain, [
    /기말고사\s*\(([^)]+)\)/i,
    /기말고사[^.\n]{0,120}?범위[:\s]*([^.\n]+)/i,
    /Final(?:\s+Exam)?[^.\n]{0,120}?\(([^)]+)\)/i,
    /Final[^.\n]{0,120}?Coverage[:\s]*([^.\n]+)/i
  ]);

  const semesterScope = pickFirstMatch(plain, [
    /(?:이번\s*학기\s*범위|Semester\s*scope)\s*:\s*(CHAPTER\s*0?1\s*[~\-]\s*0?6(?:\s*\([^)]+\))?)/i,
    /(CHAPTER\s*0?1\s*[~\-]\s*0?6(?:\s*\([^)]+\))?)/i
  ]);

  return {
    midtermCoverage,
    finalCoverage,
    semesterScope
  };
}

function hasAnyCourseFacts(facts = {}) {
  return Boolean(facts?.gradingSummary || facts?.midtermCoverage || facts?.finalCoverage || facts?.semesterScope);
}

async function fetchCourseFacts(course, lang = 'ko') {
  if (!course) return null;

  const cacheKey = `${course.code}:${lang}`;
  const cached = COURSE_FACT_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.updatedAt < COURSE_FACT_CACHE_TTL_MS) {
    return cached;
  }

  const urls = lang === 'ko'
    ? [course.pageKo, course.pageEn]
    : [course.pageEn || course.pageKo, course.pageKo];

  let resolved = null;
  for (const url of urls) {
    if (!url) continue;
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'SangdonChatbot/1.0'
        }
      });
      if (!response.ok) continue;

      const html = await response.text();
      const plain = stripHtml(html);
      const gradingSummary = extractGradingSummaryFromHtml(html);
      const coverage = extractCourseFactsFromText(plain);
      const scheduleCoverage = deriveCoverageFromScheduleTable(html);

      const facts = {
        course,
        sourceUrl: url,
        gradingSummary,
        midtermCoverage: coverage.midtermCoverage || scheduleCoverage.midtermCoverage,
        finalCoverage: coverage.finalCoverage || scheduleCoverage.finalCoverage,
        semesterScope: coverage.semesterScope,
        updatedAt: Date.now()
      };

      if (hasAnyCourseFacts(facts)) {
        resolved = facts;
        break;
      }
    } catch (error) {
      console.error(`course facts fetch error (${url}):`, error?.message || error);
    }
  }

  if (!resolved) {
    resolved = {
      course,
      sourceUrl: lang === 'ko' ? (course.pageKo || course.pageEn) : (course.pageEn || course.pageKo),
      gradingSummary: lang === 'ko'
        ? (course.gradingSummaryKo || course.gradingSummaryEn || null)
        : (course.gradingSummaryEn || course.gradingSummaryKo || null),
      midtermCoverage: null,
      finalCoverage: null,
      semesterScope: null,
      updatedAt: Date.now()
    };
  }

  COURSE_FACT_CACHE.set(cacheKey, resolved);
  return resolved;
}

function buildCourseFactDoc(facts) {
  const course = facts.course;
  const textParts = [
    `Course: ${course.titleKo} (${course.titleEn}).`
  ];
  if (facts.gradingSummary) textParts.push(`Grading: ${facts.gradingSummary}.`);
  if (facts.midtermCoverage) textParts.push(`Midterm coverage: ${facts.midtermCoverage}.`);
  if (facts.finalCoverage) textParts.push(`Final coverage: ${facts.finalCoverage}.`);
  if (facts.semesterScope) textParts.push(`Semester scope: ${facts.semesterScope}.`);
  textParts.push(`Page: ${facts.sourceUrl}.`);

  return {
    id: `course-facts-${course.code}`,
    type: 'course_fact',
    title: `${course.titleKo} (${course.titleEn}) - Facts`,
    text: textParts.join(' '),
    url: facts.sourceUrl,
    year: 2026
  };
}

function careerTimeline() {
  if (Array.isArray(SITE_PROFILE.careerTimeline) && SITE_PROFILE.careerTimeline.length) {
    return SITE_PROFILE.careerTimeline;
  }
  return [
    {
      period: '2026-03-01 to present',
      role: 'Assistant Professor at Daejeon University'
    },
    {
      period: SITE_PROFILE.formerIndustryPeriod || '2025-05 to 2026-02-28',
      role: SITE_PROFILE.formerIndustryRole || 'Game Developer at Sayberry Games'
    },
    {
      period: SITE_PROFILE.postdocPeriod || '2017-08 to 2025-04',
      role: SITE_PROFILE.postdocRole || 'Postdoctoral Researcher at KAIST Institute for Information Technology Convergence'
    }
  ];
}

function buildBaseDocs() {
  const docs = [];
  const timeline = careerTimeline();

  docs.push({
    id: 'profile',
    type: 'profile',
    title: `${SITE_PROFILE.nameKo} (${SITE_PROFILE.nameEn})`,
    text: `${SITE_PROFILE.nameKo} 교수는 ${SITE_PROFILE.appointmentDate}부터 ${SITE_PROFILE.affiliationKo} 조교수입니다. 공식 이메일은 ${SITE_PROFILE.email}입니다.`,
    url: SITE_LINKS.aboutKo,
    year: 2026
  });

  timeline.forEach((item, idx) => {
    docs.push({
      id: `career-${idx}`,
      type: 'career',
      title: `Career: ${item.period}`,
      text: `${item.period}: ${item.role}`,
      url: SITE_LINKS.aboutKo,
      year: Number(String(item.period).slice(0, 4)) || 0
    });
  });

  docs.push({
    id: 'publication-stats',
    type: 'publication_stats',
    title: 'Publication Stats',
    text: `Google Scholar(${SITE_PROFILE.scholarId}) ${PUBLICATION_STATS.sourceDate} sync: works ${PUBLICATION_STATS.scholarWorks}, cited by ${PUBLICATION_STATS.citedBy}. Homepage categories: journals ${PUBLICATION_STATS.journals}, conferences ${PUBLICATION_STATS.conferences}, standards ${PUBLICATION_STATS.standards}, patents ${PUBLICATION_STATS.patents}.`,
    url: SITE_LINKS.publications,
    year: 2026
  });

  for (const c of COURSES_2026_SPRING || []) {
    docs.push({
      id: `course-${c.code}`,
      type: 'course',
      title: `${c.titleKo} (${c.titleEn})`,
      text: `2026 Spring course: ${c.titleKo} (${c.titleEn}). Page: ${c.pageKo}.`,
      url: c.pageKo,
      year: 2026
    });
  }

  for (const post of NEWS_POSTS || []) {
    docs.push({
      id: `news-${post.date}`,
      type: 'news',
      title: post.title,
      text: `${post.title} (${post.date}): ${post.summary}`,
      url: post.url,
      year: Number(String(post.date || '').slice(0, 4)) || 0
    });
  }

  for (const p of PUBLICATIONS || []) {
    docs.push({
      id: `pub-${p.year}-${(p.title || '').slice(0, 40)}`,
      type: 'publication',
      title: p.title,
      text: `Title: ${p.title}. Journal: ${p.journal}. Year: ${p.year}. Authors: ${(p.authors || []).join(', ')}. DOI: ${p.doi || 'N/A'}.`,
      url: p.doi || SITE_LINKS.publications,
      year: p.year || 0,
      journal: p.journal || ''
    });
  }

  docs.push({
    id: 'project',
    type: 'project',
    title: SITE_PROFILE.currentProject,
    text: `${SITE_PROFILE.currentProject}. Link: ${SITE_PROFILE.currentProjectUrl}.`,
    url: SITE_PROFILE.currentProjectUrl,
    year: 2026
  });

  docs.push({
    id: 'contact',
    type: 'contact',
    title: 'Contact & Collaboration',
    text: `Email: ${SITE_PROFILE.email}. Collaboration page: ${SITE_LINKS.collaborationKo}.`,
    url: SITE_LINKS.collaborationKo,
    year: 2026
  });

  return docs;
}

const BASE_DOCS = buildBaseDocs();

function dedupeDocs(docs = []) {
  const map = new Map();
  for (const doc of docs) {
    if (!doc || !doc.id) continue;
    map.set(doc.id, doc);
  }
  return Array.from(map.values());
}

function lexicalScore(query, doc) {
  const qTokens = tokenize(query);
  if (!qTokens.length) return 0;
  const hay = normalizeForMatch(`${doc.title} ${doc.text}`);
  let score = 0;
  for (const tk of qTokens) {
    if (hay.includes(tk)) score += tk.length >= 5 ? 2 : 1;
  }
  return score;
}

async function getEmbedding(text, apiKey, taskType = 'RETRIEVAL_DOCUMENT') {
  if (!text || !apiKey) return null;
  const cacheKey = `${taskType}:${text}`;
  const cached = getCachedEmbedding(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: `models/${EMBEDDING_MODEL}`,
          content: { parts: [{ text }] },
          taskType
        })
      }
    );
    if (!response.ok) return null;
    const data = await response.json();
    const emb = data?.embedding?.values || null;
    if (emb) setCachedEmbedding(cacheKey, emb);
    return emb;
  } catch (error) {
    console.error('embedding error:', error);
    return null;
  }
}

function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function buildRuntimeDocs(query, history, lang) {
  const q = String(query || '');
  const targets = [];
  const explicit = findCourseInText(q);
  if (explicit) targets.push(explicit);

  const historyCourse = findCourseFromHistory(history);
  if (!explicit && historyCourse && isFollowupCourseIntent(q)) {
    targets.push(historyCourse);
  }

  if (!targets.length && (isExamIntent(q) || isGradingIntent(q))) {
    for (const c of COURSES_2026_SPRING || []) targets.push(c);
  }

  const uniqueTargets = Array.from(new Map(targets.map((c) => [c.code, c])).values());
  const factsList = await Promise.all(uniqueTargets.map((course) => fetchCourseFacts(course, lang)));
  const courseFactDocs = factsList
    .filter(Boolean)
    .map((facts) => buildCourseFactDoc(facts));

  const homepageDocs = await fetchHomepageSnapshotDocs();
  return [...courseFactDocs, ...homepageDocs];
}

async function retrieve(query, apiKey, runtimeDocs = []) {
  const docs = dedupeDocs([...BASE_DOCS, ...(runtimeDocs || [])]);
  const ranked = docs
    .map((doc) => ({ doc, lexical: lexicalScore(query, doc) }))
    .sort((a, b) => b.lexical - a.lexical || (b.doc.year || 0) - (a.doc.year || 0));

  let candidates = ranked.filter((r) => r.lexical > 0).slice(0, 22);
  if (!candidates.length) {
    candidates = isPublicationIntent(query)
      ? ranked.filter((r) => r.doc.type === 'publication').slice(0, 22)
      : ranked.slice(0, 22);
  }

  const lexicalTop = candidates.slice(0, MAX_RETRIEVED).map((r, idx) => ({
    doc: r.doc,
    score: (MAX_RETRIEVED - idx) / MAX_RETRIEVED
  }));

  if (!apiKey) return lexicalTop;

  const qEmb = await getEmbedding(query, apiKey, 'RETRIEVAL_QUERY');
  if (!qEmb) return lexicalTop;

  const maxLex = Math.max(...candidates.map((c) => c.lexical), 1);
  const rescored = await Promise.all(candidates.map(async (item) => {
    const dEmb = await getEmbedding(item.doc.text, apiKey, 'RETRIEVAL_DOCUMENT');
    const lexicalNorm = item.lexical / maxLex;
    if (!dEmb) return { doc: item.doc, score: lexicalNorm * 0.2 };
    const sim = cosineSimilarity(qEmb, dEmb);
    return { doc: item.doc, score: (0.82 * sim) + (0.18 * lexicalNorm) };
  }));

  return rescored.sort((a, b) => b.score - a.score).slice(0, MAX_RETRIEVED);
}

function formatSearchTitle(doc) {
  if (doc.type === 'publication') {
    return `${doc.title} (${doc.year})${doc.journal ? ` - ${doc.journal}` : ''}`;
  }
  return doc.title;
}

function buildSearchPayload(entries = []) {
  const sliced = entries.slice(0, MAX_RESULTS).map((e) => ({
    type: e.doc?.type || e.type || 'result',
    title: formatSearchTitle(e.doc || e),
    url: e.doc?.url || e.url || null,
    score: typeof e.score === 'number' ? Number(e.score.toFixed(3)) : null
  }));

  return {
    searchResults: sliced.length ? sliced.map((r) => r.title) : null,
    searchResultsDetailed: sliced.length ? sliced.map((r) => ({
      type: r.type,
      item: { title: r.title, url: r.url, score: r.score }
    })) : null
  };
}

function buildPrompt(message, history, retrieved, lang) {
  const recent = safeHistory(history)
    .slice(-6)
    .map((h) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`)
    .join('\n');

  const context = (retrieved || []).map((r, i) => {
    const doc = r.doc || r;
    const text = String(doc.text || '');
    const clipped = text.length > MAX_CONTEXT_TEXT_CHARS
      ? `${text.slice(0, MAX_CONTEXT_TEXT_CHARS)}...`
      : text;
    return `[${i + 1}] type=${doc.type}\ntitle=${doc.title}\nurl=${doc.url || 'N/A'}\ntext=${clipped}`;
  }).join('\n\n');

  return [
    `You are the official homepage assistant for ${SITE_PROFILE.nameEn}.`,
    '- Answer strictly from the given context.',
    '- If context is insufficient, say the information is not currently confirmed in provided materials.',
    '- For exam-range or grading questions, quote exact range/weights from context.',
    '- For follow-up questions, use recent conversation to resolve omitted subject/course.',
    `- Contact email is ${SITE_PROFILE.email}.`,
    '- Keep answer concise and factual (1-4 sentences).',
    `- Respond in ${lang === 'ko' ? 'Korean' : 'English'}.`,
    '',
    `Question: ${message}`,
    '',
    `Recent conversation:\n${recent || '(none)'}`,
    '',
    `Context:\n${context || '(none)'}`
  ].join('\n');
}

async function generateReply(prompt, apiKey) {
  if (!apiKey) return null;
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2
          }
        })
      }
    );
    if (!response.ok) return null;
    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (error) {
    console.error('generate reply error:', error);
    return null;
  }
}

function isWeakReply(text = '') {
  const n = normalize(text);
  if (!n) return true;
  if (n.length < 8) return true;
  return /(질문 확인|찾아보겠|how can i help|cannot classify|관련 자료를 찾았습니다\. 우선)/i.test(text);
}

function parseCoverageFromDocText(text = '', type = 'midterm') {
  const source = String(text || '');
  const patterns = type === 'midterm'
    ? [
      /중간고사\s*범위[:\s]*([^.\n]+)/i,
      /중간고사\s*\(([^)]+)\)/i,
      /Midterm coverage:\s*([^.\n]+)/i,
      /Midterm(?:\s+Exam)?\s*\(([^)]+)\)/i
    ]
    : [
      /기말고사\s*범위[:\s]*([^.\n]+)/i,
      /기말고사\s*\(([^)]+)\)/i,
      /Final coverage:\s*([^.\n]+)/i,
      /Final(?:\s+Exam)?\s*\(([^)]+)\)/i
    ];
  return pickFirstMatch(source, patterns);
}

function parseSemesterScopeFromDocText(text = '') {
  const source = String(text || '');
  return pickFirstMatch(source, [
    /(?:이번\s*학기\s*범위|Semester\s*scope)\s*:\s*(CHAPTER\s*0?1\s*[~\-]\s*0?6(?:\s*\([^)]+\))?)/i,
    /(CHAPTER\s*0?1\s*[~\-]\s*0?6(?:\s*\([^)]+\))?)/i
  ]);
}

function parseGradingFromDocText(text = '') {
  const source = String(text || '');
  return pickFirstMatch(source, [
    /Grading:\s*([^.\n]+)/i,
    /평가\s*배점[:\s]*([^.\n]+)/i
  ]);
}

function parseTextbookFromDocText(text = '') {
  const source = String(text || '');
  const direct = pickFirstMatch(source, [
    /(?:^|\s)교재\s*:\s*([\s\S]*?)(?=\s*이번\s*학기\s*범위:|\s*실습\s*코드|\s*동기화\s*기준|\s*교재\s*정보:|$)/i,
    /(?:^|\s)Textbook\s*:\s*([\s\S]*?)(?=\s*Semester\s*scope:|\s*Lab\s*code|\s*Sync\s*baseline|\s*Book\s*info|$)/i,
    /(?:^|\s)Book\s*:\s*([^.\n]+)/i
  ]);
  if (direct && direct.length <= 180 && !/(강의자료|공지|Announcements|TOP|const\s+sidebar|document\.getElementById)/i.test(direct)) {
    return direct.trim();
  }

  if (/혼자\s*공부하는\s*머신러닝\+딥러닝/i.test(source)) {
    return '박해선, 「혼자 공부하는 머신러닝+딥러닝」 개정판, 한빛미디어';
  }
  if (/self-study\s*machine learning\s*\+\s*deep learning/i.test(source)) {
    return 'Park Haesun, "Self-Study Machine Learning + Deep Learning" (Revised), Hanbit Media';
  }
  return null;
}

function summarizeTopDoc(top, lang) {
  const doc = top?.doc || top;
  if (!doc) {
    return tr(
      lang,
      '현재 질문에 대해 확인 가능한 근거가 부족합니다. 과목명이나 논문 제목을 함께 보내주세요.',
      'I need a more specific keyword (course name or paper title) to answer accurately.'
    );
  }

  if (doc.type === 'publication') {
    const line = `${doc.title} (${doc.year || 'N/A'})${doc.journal ? `, ${doc.journal}` : ''}`;
    return tr(
      lang,
      `관련 논문은 ${line}입니다.${doc.url ? ` 링크: ${doc.url}` : ''}`,
      `A relevant paper is ${line}.${doc.url ? ` Link: ${doc.url}` : ''}`
    );
  }

  if (doc.type === 'course' || doc.type === 'course_fact') {
    return tr(
      lang,
      `${doc.title} 관련 정보입니다. 자세한 내용은 ${doc.url || SITE_LINKS.coursesHubKo}에서 확인할 수 있습니다.`,
      `This is course information for ${doc.title}. Details: ${doc.url || SITE_LINKS.coursesHubEn}`
    );
  }

  return tr(
    lang,
    `관련 정보: ${doc.title}${doc.url ? ` (${doc.url})` : ''}`,
    `Relevant information: ${doc.title}${doc.url ? ` (${doc.url})` : ''}`
  );
}

function buildFallbackReply(message, retrieved, lang, history = []) {
  if (isContactIntent(message)) {
    return tr(lang, `문의 이메일은 ${SITE_PROFILE.email}입니다.`, `Contact email: ${SITE_PROFILE.email}.`);
  }

  if (isLinkIntent(message)) {
    const text = String(message || '');
    if (/(hexagon|steam|project|게임|프로젝트)/i.test(text)) {
      return tr(
        lang,
        `Hexagon Soup 링크는 ${SITE_PROFILE.currentProjectUrl}입니다.`,
        `Hexagon Soup link: ${SITE_PROFILE.currentProjectUrl}`
      );
    }
    if (/(scholar|구글\s*스칼라|google\s*scholar|citation)/i.test(text)) {
      return tr(
        lang,
        `Google Scholar 주소는 ${SITE_PROFILE.scholarUrl}입니다.`,
        `Google Scholar URL: ${SITE_PROFILE.scholarUrl}`
      );
    }
    if (/(github|깃허브)/i.test(text)) {
      return tr(
        lang,
        `GitHub 주소는 ${SITE_PROFILE.githubUrl}입니다.`,
        `GitHub URL: ${SITE_PROFILE.githubUrl}`
      );
    }
    if (/(linkedin|링크드인)/i.test(text)) {
      return tr(
        lang,
        `LinkedIn 주소는 ${SITE_PROFILE.linkedinUrl}입니다.`,
        `LinkedIn URL: ${SITE_PROFILE.linkedinUrl}`
      );
    }
    if (/(논문|publication|publications)/i.test(text)) {
      return tr(
        lang,
        `논문 페이지 주소는 ${SITE_LINKS.publications}입니다.`,
        `Publications page URL: ${SITE_LINKS.publications}`
      );
    }
    if (/(과목|강의|수업|course|teaching)/i.test(text)) {
      return tr(
        lang,
        `과목 허브 주소는 ${SITE_LINKS.coursesHubKo}입니다.`,
        `Course hub URL: ${SITE_LINKS.coursesHubEn}`
      );
    }

    return tr(
      lang,
      `공식 홈페이지 주소는 ${SITE_PROFILE.website}입니다. 한국어 페이지: ${SITE_LINKS.homeKo}, 영어 페이지: ${SITE_LINKS.homeEn}`,
      `Official website URL: ${SITE_PROFILE.website}. Korean page: ${SITE_LINKS.homeKo}, English page: ${SITE_LINKS.homeEn}`
    );
  }

  if (isProfileIntent(message)) {
    return tr(
      lang,
      `${SITE_PROFILE.nameKo} 교수는 ${SITE_PROFILE.appointmentDate}부터 ${SITE_PROFILE.affiliationKo} 조교수로 재직 중입니다.`,
      `${SITE_PROFILE.nameEn} has been Assistant Professor at ${SITE_PROFILE.affiliationEn} since ${SITE_PROFILE.appointmentDate}.`
    );
  }

  if (isBeforeThatIntent(message)) {
    const historyText = normalize((history || []).map((h) => h?.content || '').join(' '));
    const djuHint = /(대전대학교|조교수|assistant professor|daejeon)/i.test(historyText);
    const sayberryHint = /(sayberry|세이베리|game developer|게임 개발)/i.test(historyText);

    if (sayberryHint) {
      return tr(
        lang,
        `${SITE_PROFILE.formerIndustryPeriod} 이전에는 ${SITE_PROFILE.postdocPeriod} 동안 ${SITE_PROFILE.postdocRole}로 근무했습니다.`,
        `Before ${SITE_PROFILE.formerIndustryPeriod}, he worked as ${SITE_PROFILE.postdocRole} during ${SITE_PROFILE.postdocPeriod}.`
      );
    }
    if (djuHint) {
      return tr(
        lang,
        `대전대학교 부임 직전에는 ${SITE_PROFILE.formerIndustryPeriod} 동안 ${SITE_PROFILE.formerIndustryRole}로 근무했습니다.`,
        `Right before joining Daejeon University, he worked as ${SITE_PROFILE.formerIndustryRole} during ${SITE_PROFILE.formerIndustryPeriod}.`
      );
    }

    return tr(
      lang,
      `대전대학교 부임 직전에는 ${SITE_PROFILE.formerIndustryPeriod} 동안 ${SITE_PROFILE.formerIndustryRole}로 근무했습니다.`,
      `Right before joining Daejeon University, he worked as ${SITE_PROFILE.formerIndustryRole} during ${SITE_PROFILE.formerIndustryPeriod}.`
    );
  }

  if (!retrieved || retrieved.length === 0) {
    return tr(
      lang,
      `현재 제공된 자료에서 바로 확인되지 않습니다. 과목명/논문제목 등 키워드를 함께 보내주세요. (${SITE_PROFILE.email})`,
      `I cannot confirm this from the current materials. Please include a specific keyword (course or paper title). (${SITE_PROFILE.email})`
    );
  }

  if (isTextbookIntent(message)) {
    const explicitCourse = findCourseInText(message);
    const historyCourse = findCourseFromHistory(history);
    const targetCourse = explicitCourse || historyCourse;

    const docs = retrieved.map((r) => r.doc || r);
    const relevant = targetCourse
      ? docs.filter((d) => {
        const hay = normalize(`${d.title} ${d.text}`);
        return hay.includes(normalize(targetCourse.titleKo)) || hay.includes(normalize(targetCourse.titleEn));
      })
      : docs;

    const textbook = (relevant.length ? relevant : docs)
      .map((d) => parseTextbookFromDocText(d.text))
      .find(Boolean);

    if (textbook) {
      return tr(
        lang,
        `${targetCourse ? `${targetCourse.titleKo} ` : ''}교재는 ${textbook}입니다.`,
        `${targetCourse ? `${targetCourse.titleEn} ` : ''}textbook is ${textbook}.`
      );
    }
  }

  if (isExamIntent(message)) {
    const explicitCourse = findCourseInText(message);
    const historyCourse = findCourseFromHistory(history);
    const targetCourse = explicitCourse || historyCourse;
    const wantsMidterm = /(중간|midterm)/i.test(message);
    const wantsFinal = /(기말|final)/i.test(message);

    const courseDocs = retrieved
      .map((r) => r.doc || r)
      .filter((d) => d.type === 'course_fact' || d.type === 'course');

    const filteredDocs = targetCourse
      ? courseDocs.filter((d) => normalize(d.title).includes(normalize(targetCourse.titleKo)) || normalize(d.title).includes(normalize(targetCourse.titleEn)))
      : courseDocs;

    const docsForRange = filteredDocs.length ? filteredDocs : courseDocs;
    const mid = docsForRange.map((d) => parseCoverageFromDocText(d.text, 'midterm')).find(Boolean);
    const fin = docsForRange.map((d) => parseCoverageFromDocText(d.text, 'final')).find(Boolean);
    const scope = docsForRange.map((d) => parseSemesterScopeFromDocText(d.text)).find(Boolean);

    if (wantsMidterm && mid) {
      return tr(
        lang,
        `${targetCourse ? `${targetCourse.titleKo} ` : ''}중간고사 범위는 ${mid}입니다.`,
        `${targetCourse ? `${targetCourse.titleEn} ` : ''}midterm coverage is ${mid}.`
      );
    }
    if (wantsFinal && fin) {
      return tr(
        lang,
        `${targetCourse ? `${targetCourse.titleKo} ` : ''}기말고사 범위는 ${fin}입니다.`,
        `${targetCourse ? `${targetCourse.titleEn} ` : ''}final coverage is ${fin}.`
      );
    }
    if (!wantsMidterm && !wantsFinal && (mid || fin)) {
      const parts = [];
      if (mid) parts.push(`중간 ${mid}`);
      if (fin) parts.push(`기말 ${fin}`);
      return tr(
        lang,
        `${targetCourse ? `${targetCourse.titleKo} ` : ''}시험 범위는 ${parts.join(' / ')}입니다.`,
        `${targetCourse ? `${targetCourse.titleEn} ` : ''}exam coverage is ${parts.join(' / ')}.`
      );
    }

    if (scope) {
      if (wantsMidterm || wantsFinal) {
        return tr(
          lang,
          `${targetCourse ? `${targetCourse.titleKo} ` : ''}${wantsMidterm ? '중간고사' : '기말고사'} 세부 범위는 별도 공지 기준이며, 현재 페이지에 공개된 학기 범위는 ${scope}입니다.`,
          `${targetCourse ? `${targetCourse.titleEn} ` : ''}${wantsMidterm ? 'midterm' : 'final'} detailed coverage follows course notice, and the currently published semester scope is ${scope}.`
        );
      }
      return tr(
        lang,
        `${targetCourse ? `${targetCourse.titleKo} ` : ''}시험범위는 ${scope}입니다.`,
        `${targetCourse ? `${targetCourse.titleEn} ` : ''}exam scope is ${scope}.`
      );
    }

    return tr(
      lang,
      '해당 시험 범위는 현재 수집된 자료에서 명시적으로 확인되지 않습니다. 과목 페이지 공지를 함께 확인해 주세요.',
      'The requested exam coverage is not explicitly confirmed in the collected materials yet. Please also check course announcements.'
    );
  }

  if (isGradingIntent(message)) {
    const explicitCourse = findCourseInText(message);
    const historyCourse = findCourseFromHistory(history);
    const targetCourse = explicitCourse || historyCourse;

    const courseDocs = retrieved
      .map((r) => r.doc || r)
      .filter((d) => d.type === 'course_fact' || d.type === 'course');

    const filteredDocs = targetCourse
      ? courseDocs.filter((d) => normalize(d.title).includes(normalize(targetCourse.titleKo)) || normalize(d.title).includes(normalize(targetCourse.titleEn)))
      : courseDocs;

    const grading = (filteredDocs.length ? filteredDocs : courseDocs)
      .map((d) => parseGradingFromDocText(d.text))
      .find(Boolean);

    if (grading) {
      return tr(
        lang,
        `${targetCourse ? `${targetCourse.titleKo} ` : ''}평가 배점은 ${grading}입니다.`,
        `${targetCourse ? `${targetCourse.titleEn} ` : ''}grading is ${grading}.`
      );
    }
  }

  return summarizeTopDoc(retrieved[0], lang);
}

function classifyStep1(message, lang) {
  if (isGreeting(message)) {
    return {
      action: 'CHAT',
      query: '',
      initialMessage: tr(lang, '안녕하세요. 무엇을 도와드릴까요?', 'Hello. How can I help you?'),
      needsSecondStep: false
    };
  }

  return {
    action: 'SEARCH',
    query: String(message || '').trim(),
    initialMessage: tr(lang, '질문 확인했습니다. 관련 정보를 찾아보겠습니다.', 'Got it. I will look up relevant information.'),
    needsSecondStep: true
  };
}

async function logToSupabase(event, payload) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return;

    const supabase = createClient(supabaseUrl, supabaseKey);
    const ip = event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown';

    await supabase.from('chat_logs').insert([{
      user_message: payload.message,
      bot_response: payload.reply,
      conversation_history: safeHistory(payload.history),
      action_taken: payload.action || null,
      search_results: Array.isArray(payload.searchResults) ? payload.searchResults : null,
      user_ip: ip,
      user_agent: event.headers['user-agent'] || 'unknown'
    }]);
  } catch (error) {
    console.error('supabase log error:', error);
  }
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const message = String(body.message || '').trim();
    const history = safeHistory(body.history);
    const step = Number(body.step || 1);

    if (!message) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Message required' }) };
    }

    const lang = detectLanguage(message, history);

    if (step === 1) {
      const decision = classifyStep1(message, lang);
      if (decision.action === 'CHAT') {
        await logToSupabase(event, {
          message,
          reply: decision.initialMessage,
          history,
          action: 'CHAT',
          searchResults: null
        });
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          step: 1,
          action: decision.action,
          query: decision.query,
          initialMessage: decision.initialMessage,
          needsSecondStep: decision.needsSecondStep
        })
      };
    }

    const action = String(body.action || 'SEARCH').toUpperCase();
    if (action === 'CHAT' || isGreeting(message)) {
      const reply = tr(
        lang,
        '안녕하세요. 궁금한 내용을 한 문장으로 보내주시면 바로 안내드리겠습니다.',
        'Hello. Ask a concrete question and I will answer right away.'
      );
      await logToSupabase(event, { message, reply, history, action: 'CHAT', searchResults: null });
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ step: 2, reply, searchResults: null, searchResultsDetailed: null })
      };
    }

    const apiKey = process.env.GEMINI_API_KEY || '';
    const rawQuery = String(body.query || message).trim();
    const query = expandQueryWithHistory(rawQuery, history);
    const runtimeDocs = await buildRuntimeDocs(query, history, lang);
    const retrieved = await retrieve(query, apiKey, runtimeDocs);
    const payload = buildSearchPayload(retrieved);

    const forceFallback = isBeforeThatIntent(message) || isExamIntent(message) || isGradingIntent(message) || isTextbookIntent(message) || isLinkIntent(message);
    let reply = null;
    if (apiKey && !forceFallback) {
      const prompt = buildPrompt(message, history, retrieved, lang);
      reply = await generateReply(prompt, apiKey);
    }

    if (!reply || isWeakReply(reply)) {
      reply = buildFallbackReply(message, retrieved, lang, history);
    }

    if (isContactIntent(message) && !reply.includes(SITE_PROFILE.email)) {
      reply += `\n\n${tr(lang, '연락처', 'Contact')}: ${SITE_PROFILE.email}`;
    }

    await logToSupabase(event, {
      message,
      reply,
      history,
      action,
      searchResults: payload.searchResults
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        step: 2,
        reply,
        searchResults: payload.searchResults,
        searchResultsDetailed: payload.searchResultsDetailed
      })
    };
  } catch (error) {
    console.error('chat-ai-driven error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error' }) };
  }
};
