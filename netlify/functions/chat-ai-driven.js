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
const MAX_HISTORY = 8;
const MAX_RETRIEVED_DOCS = 6;
const MAX_SEARCH_RESULTS = 5;

const TEXT = {
  ko: {
    greeting: '안녕하세요. 무엇을 도와드릴까요?',
    searching: '질문 확인했습니다. 관련 정보를 찾아보겠습니다.',
    chatHint: '구체적으로 질문해 주시면 홈페이지 기준으로 정확히 안내하겠습니다.',
    fallback: '질문을 확인했습니다. 공개된 정보 기준으로 확답이 어려우면 논문 페이지나 이메일로 확인해 주세요.',
    contactLabel: '연락처',
    resultsHint: '관련 자료를 찾았습니다. 이어서 구체 질문을 주시면 더 정확히 안내하겠습니다.'
  },
  en: {
    greeting: 'Hello. How can I help you?',
    searching: 'Got it. I will look up relevant information.',
    chatHint: 'If you ask a specific question, I will answer with facts from the homepage.',
    fallback: 'I received your question. If publicly available context is insufficient, please check the publications page or contact email.',
    contactLabel: 'Contact',
    resultsHint: 'I found relevant information. Ask a specific follow-up question for a more precise answer.'
  }
};

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'about', 'what', 'which', 'when', 'where',
  'who', 'how', 'tell', 'please', 'paper', 'papers', 'publication', 'publications',
  'journal', 'journals', '논문', '학술', '저널', '관련'
]);

const KNOWLEDGE_DOCS = buildKnowledgeDocs();

function t(lang, koOrKey, enText) {
  if (typeof enText === 'string') {
    return lang === 'ko' ? koOrKey : enText;
  }
  const key = koOrKey;
  return (TEXT[lang] && TEXT[lang][key]) || TEXT.en[key] || '';
}

function containsHangul(text = '') {
  return /[가-힣]/.test(String(text));
}

function detectLanguage(message = '', history = []) {
  if (containsHangul(message)) return 'ko';
  for (let i = history.length - 1; i >= 0; i -= 1) {
    if (containsHangul(history[i] && history[i].content ? history[i].content : '')) return 'ko';
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

function isGreetingOnlyMessage(message = '') {
  const clean = normalize(message).replace(/[!?.,]/g, '');
  return (
    /^(안녕|안녕하세요|ㅎㅇ|하이|헬로|g2|h2)$/.test(clean) ||
    /^(hello|hi|hey|good morning|good afternoon|good evening)$/.test(clean)
  );
}

function isGenericGreetingReply(text = '') {
  const n = normalize(text);
  return n.includes('무엇을 도와드릴까요') || n.includes('how can i help');
}

function isPublicationIntent(text = '') {
  return /(논문|학술|저널|publication|paper|journal|doi|ieee|scholar)/i.test(text);
}

function isCountIntent(text = '') {
  return /(how many|count|number of|총|몇|개수|편|건|횟수)/i.test(text);
}

function isLatestIntent(text = '') {
  return /(latest|recent|newest|최근|최신|근래)/i.test(text);
}

function isRepresentativeIntent(text = '') {
  return /(대표|핵심|highlight|representative|key paper|selected)/i.test(text);
}

function isContactIntent(text = '') {
  return /(contact|email|mail|reach|연락|이메일|문의)/i.test(text);
}

function isCourseIntent(text = '') {
  return /(course|class|lecture|teaching|강의|과목|수업|교육|캡스톤|인공지능|database|db)/i.test(text);
}

function isProfileIntent(text = '') {
  return /(about|bio|who are|what do you do|소개|약력|학력|경력|무슨 일|무슨일|소속|직위|연구 분야)/i.test(text);
}

function isProjectIntent(text = '') {
  return /(hexagon|steam|project|프로젝트|game|게임)/i.test(text);
}

function isCoauthorIntent(text = '') {
  return /(coauthor|collaborator|공동저자|공동연구|같이)/i.test(text);
}

function isMostIntent(text = '') {
  return /(most|top|??|??|??)/i.test(text);
}

function isLikelySmallTalk(message = '') {
  const text = normalize(message);
  if (!text) return false;

  if (
    isPublicationIntent(text) ||
    isCourseIntent(text) ||
    isContactIntent(text) ||
    isProjectIntent(text) ||
    isProfileIntent(text)
  ) {
    return false;
  }

  const compact = text.replace(/\s+/g, '');
  const tokenCount = text.split(/\s+/).filter(Boolean).length;

  if (compact.length <= 6 && tokenCount <= 2) {
    return true;
  }

  return false;
}

function classifyStep1(message, lang) {
  if (isGreetingOnlyMessage(message) || isLikelySmallTalk(message)) {
    return {
      action: 'CHAT',
      query: '',
      initialMessage: t(lang, 'greeting'),
      needsSecondStep: false
    };
  }

  return {
    action: 'SEARCH',
    query: String(message || '').trim(),
    initialMessage: t(lang, 'searching'),
    needsSecondStep: true
  };
}

function buildKnowledgeDocs() {
  const docs = [];

  docs.push({
    id: 'profile',
    type: 'profile',
    title: `${SITE_PROFILE.nameKo} (${SITE_PROFILE.nameEn})`,
    year: 2026,
    url: SITE_LINKS.aboutKo,
    journal: '',
    keywords: [
      SITE_PROFILE.nameKo,
      SITE_PROFILE.nameEn,
      'AxGS Lab',
      'Assistant Professor',
      '대전대학교'
    ],
    text:
      `${SITE_PROFILE.nameKo}(${SITE_PROFILE.nameEn})은 ${SITE_PROFILE.affiliationKo} 조교수입니다. ` +
      `임용일은 ${SITE_PROFILE.appointmentDate}이며, 공식 이메일은 ${SITE_PROFILE.email}입니다.`
  });

  docs.push({
    id: 'career',
    type: 'career',
    title: 'Career Timeline',
    year: 2026,
    url: SITE_LINKS.aboutKo,
    journal: '',
    keywords: ['career', '세이베리게임즈', 'Sayberry Games', '대전대학교'],
    text:
      `2025-05부터 2026-02-28까지 ${SITE_PROFILE.formerIndustryRole}로 근무했고, ` +
      `${SITE_PROFILE.appointmentDate}부터 대전대학교에서 근무 중입니다.`
  });

  docs.push({
    id: 'research',
    type: 'research',
    title: 'Research Areas',
    year: 2026,
    url: SITE_LINKS.homeKo + '#research',
    journal: '',
    keywords: ['AI x Games Systems', 'Trustworthy AI', 'Optimization', 'RAG', 'LLM'],
    text: '핵심 키워드는 AI x Games Systems, Trustworthy AI, Optimization이며, LLM/RAG 시스템을 실제 서비스 단위로 구현합니다.'
  });

  docs.push({
    id: 'contact',
    type: 'contact',
    title: 'Contact & Collaboration',
    year: 2026,
    url: SITE_LINKS.collaborationKo,
    journal: '',
    keywords: ['contact', 'email', '문의', '공동연구'],
    text: `문의 이메일은 ${SITE_PROFILE.email}이며, 학생/공동연구 안내 페이지는 ${SITE_LINKS.collaborationKo}입니다.`
  });

  docs.push({
    id: 'project',
    type: 'project',
    title: SITE_PROFILE.currentProject,
    year: 2026,
    url: SITE_PROFILE.currentProjectUrl,
    journal: '',
    keywords: ['Hexagon Soup', 'Steam', 'solo development', '게임'],
    text: `Hexagon Soup는 현재 진행 중인 1인 개발 프로젝트이며 Steam 링크는 ${SITE_PROFILE.currentProjectUrl}입니다.`
  });

  docs.push({
    id: 'publication-stats',
    type: 'publication_stats',
    title: 'Publication Stats',
    year: 2026,
    url: SITE_LINKS.publications,
    journal: '',
    keywords: ['Google Scholar', 'cited by', 'works', 'publications', '논문 수'],
    text:
      `Google Scholar(${SITE_PROFILE.scholarId}) ${PUBLICATION_STATS.sourceDate} 기준 works ${PUBLICATION_STATS.scholarWorks}, ` +
      `cited by ${PUBLICATION_STATS.citedBy}. 홈페이지 분류 기준 국제저널 ${PUBLICATION_STATS.journals}편, 국제학회 ${PUBLICATION_STATS.conferences}편, ITU-T ${PUBLICATION_STATS.standards}건, 특허 ${PUBLICATION_STATS.patents}건.`
  });

  for (const course of COURSES_2026_SPRING) {
    docs.push({
      id: `course-${course.code.toLowerCase().replace(/\s+/g, '-')}`,
      type: 'course',
      title: `${course.titleKo} (${course.titleEn})`,
      year: 2026,
      url: course.pageKo,
      journal: '',
      keywords: [course.titleKo, course.titleEn, 'course', '강의', '2026-1'],
      text: `과목 페이지: ${course.pageKo}. 영문 페이지: ${course.pageEn}.`
    });
  }

  for (const post of NEWS_POSTS) {
    docs.push({
      id: `news-${post.date}`,
      type: 'news',
      title: post.title,
      year: Number((post.date || '').slice(0, 4)) || 0,
      url: post.url,
      journal: '',
      keywords: [post.title, 'news', 'post', 'career', 'AI'],
      text: `${post.title} (${post.date}) - ${post.summary}.`
    });
  }

  for (const pub of PUBLICATIONS) {
    const authors = Array.isArray(pub.authors) ? pub.authors.join(', ') : '';
    const keywords = Array.isArray(pub.keywords) ? pub.keywords.join(', ') : '';
    docs.push({
      id: `pub-${pub.year}-${slugify(pub.title)}`,
      type: 'publication',
      title: pub.title,
      year: pub.year || 0,
      url: pub.doi || SITE_LINKS.publications,
      journal: pub.journal || '',
      keywords: [pub.journal || '', ...(pub.keywords || [])],
      text: `Title: ${pub.title}. Journal: ${pub.journal}. Year: ${pub.year}. Authors: ${authors}. DOI: ${pub.doi || 'N/A'}. Keywords: ${keywords}.`
    });
  }

  return docs;
}

function slugify(text = '') {
  return String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

function lexicalScore(query, doc) {
  const qTokens = tokenize(query).filter((tk) => !STOPWORDS.has(tk));
  if (!qTokens.length) return 0;
  const hay = normalizeForMatch([doc.title, doc.text, doc.journal, ...(doc.keywords || [])].join(' '));
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
    const embedding = data && data.embedding ? data.embedding.values : null;
    if (embedding) setCachedEmbedding(cacheKey, embedding);
    return embedding;
  } catch (error) {
    console.error('Embedding error:', error);
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

async function retrieve(query, apiKey) {
  const ranked = KNOWLEDGE_DOCS
    .map((doc) => ({ doc, lexical: lexicalScore(query, doc) }))
    .sort((x, y) => {
      if (y.lexical !== x.lexical) return y.lexical - x.lexical;
      return (y.doc.year || 0) - (x.doc.year || 0);
    });

  let candidates = ranked.filter((r) => r.lexical > 0).slice(0, 18);
  if (candidates.length < 10) {
    const fallback = isPublicationIntent(query)
      ? ranked.filter((r) => r.doc.type === 'publication').slice(0, 18)
      : ranked.slice(0, 18);
    const byId = new Map();
    for (const item of [...candidates, ...fallback]) byId.set(item.doc.id, item);
    candidates = Array.from(byId.values()).slice(0, 18);
  }

  const lexicalTop = candidates.slice(0, MAX_RETRIEVED_DOCS).map((item, idx) => ({
    doc: item.doc,
    score: (MAX_RETRIEVED_DOCS - idx) / MAX_RETRIEVED_DOCS,
    lexical: item.lexical,
    similarity: null
  }));
  if (!apiKey) return lexicalTop;

  const qEmbedding = await getEmbedding(query, apiKey, 'RETRIEVAL_QUERY');
  if (!qEmbedding) return lexicalTop;

  const maxLexical = Math.max(...candidates.map((c) => c.lexical), 1);
  const scored = await Promise.all(
    candidates.map(async (item) => {
      const docEmbedding = await getEmbedding(item.doc.text, apiKey, 'RETRIEVAL_DOCUMENT');
      const lexicalNorm = item.lexical / maxLexical;
      if (!docEmbedding) {
        return { doc: item.doc, score: lexicalNorm * 0.25, lexical: item.lexical, similarity: null };
      }
      const sim = cosineSimilarity(qEmbedding, docEmbedding);
      return {
        doc: item.doc,
        score: (0.82 * sim) + (0.18 * lexicalNorm),
        lexical: item.lexical,
        similarity: sim
      };
    })
  );

  return scored.sort((a, b) => b.score - a.score).slice(0, MAX_RETRIEVED_DOCS);
}

function formatResultLabel(item, lang) {
  if (item.type === 'publication') return t(lang, `[논문] ${item.title} (${item.year}) - ${item.journal}`, `[Paper] ${item.title} (${item.year}) - ${item.journal}`);
  if (item.type === 'course') return t(lang, `[과목] ${item.title}`, `[Course] ${item.title}`);
  if (item.type === 'project') return t(lang, `[프로젝트] ${item.title}`, `[Project] ${item.title}`);
  if (item.type === 'news') return t(lang, `[소식] ${item.title}`, `[News] ${item.title}`);
  if (item.type === 'contact') return t(lang, `[문의] ${item.title}`, `[Contact] ${item.title}`);
  return `[${item.type}] ${item.title}`;
}

function buildSearchPayload(items, lang) {
  const normalized = (items || []).map((entry) => {
    if (entry.doc) return { ...entry.doc, score: entry.score };
    return entry;
  }).slice(0, MAX_SEARCH_RESULTS);

  const detailed = normalized.map((item) => ({
    type: item.type || 'result',
    item: {
      title: formatResultLabel(item, lang),
      url: item.url || null,
      score: typeof item.score === 'number' ? Number(item.score.toFixed(3)) : null
    }
  }));

  return {
    searchResults: detailed.length ? detailed.map((x) => x.item.title) : null,
    searchResultsDetailed: detailed.length ? detailed : null
  };
}

function findPublicationByQuery(query) {
  const qTokens = tokenize(query).filter((tk) => !STOPWORDS.has(tk));
  if (!qTokens.length) return null;
  let best = null;
  for (const pub of PUBLICATIONS) {
    const hay = normalizeForMatch(`${pub.title} ${pub.journal} ${pub.year}`);
    let score = 0;
    for (const tk of qTokens) if (hay.includes(tk)) score += 1;
    if (normalizeForMatch(pub.title).includes(normalizeForMatch(query))) score += 6;
    if (!best || score > best.score) best = { pub, score };
  }
  return best && best.score >= 3 ? best.pub : null;
}

function coauthorTop() {
  const self = new Set([normalize('sangdon park'), normalize(SITE_PROFILE.nameKo), normalize(SITE_PROFILE.nameEn)]);
  const count = new Map();
  for (const pub of PUBLICATIONS) {
    for (const author of pub.authors || []) {
      const n = normalize(author);
      if (!n || self.has(n)) continue;
      count.set(author, (count.get(author) || 0) + 1);
    }
  }
  return Array.from(count.entries()).sort((a, b) => b[1] - a[1]);
}

function deterministic(message, lang) {
  if (isGreetingOnlyMessage(message)) {
    return { reply: t(lang, 'greeting'), docs: [] };
  }

  if (isContactIntent(message)) {
    return {
      reply: t(lang, `문의 이메일은 ${SITE_PROFILE.email}입니다. 안내 페이지: ${SITE_LINKS.collaborationKo}`, `Contact email: ${SITE_PROFILE.email}. Guide page: ${SITE_LINKS.collaborationEn}`),
      docs: [{ type: 'contact', title: 'Contact & Collaboration', url: SITE_LINKS.collaborationKo, score: 1 }]
    };
  }

  if (isCourseIntent(message)) {
    const reply = isCountIntent(message)
      ? t(lang, `2026년 1학기 담당 과목은 총 3개입니다: 데이터베이스시스템, 인공지능, 캡스톤디자인.`, `There are 3 courses in 2026 Spring: Database Systems, Artificial Intelligence, Capstone Design.`)
      : t(lang, `이번 학기 과목은 데이터베이스시스템, 인공지능, 캡스톤디자인입니다. 과목 허브: ${SITE_LINKS.coursesHubKo}`, `Courses this semester: Database Systems, Artificial Intelligence, Capstone Design. Course hub: ${SITE_LINKS.coursesHubEn}`);
    return {
      reply,
      docs: COURSES_2026_SPRING.map((c, i) => ({ type: 'course', title: `${c.titleKo} (${c.titleEn})`, url: c.pageKo, score: 1 - i * 0.1 }))
    };
  }

  if (isPublicationIntent(message) && isCountIntent(message)) {
    return {
      reply: t(
        lang,
        `홈페이지 기준 국제저널 ${PUBLICATION_STATS.journals}편, 국제학회 ${PUBLICATION_STATS.conferences}편, ITU-T 표준 ${PUBLICATION_STATS.standards}건, 특허 ${PUBLICATION_STATS.patents}건입니다. Google Scholar(${PUBLICATION_STATS.sourceDate}) 기준 works ${PUBLICATION_STATS.scholarWorks}, cited by ${PUBLICATION_STATS.citedBy}입니다.`,
        `Homepage stats: ${PUBLICATION_STATS.journals} journals, ${PUBLICATION_STATS.conferences} conferences, ${PUBLICATION_STATS.standards} ITU-T standards, ${PUBLICATION_STATS.patents} patents. Google Scholar (${PUBLICATION_STATS.sourceDate}): ${PUBLICATION_STATS.scholarWorks} works, cited by ${PUBLICATION_STATS.citedBy}.`
      ),
      docs: [{ type: 'publication_stats', title: 'Publication Stats', url: SITE_LINKS.publications, score: 1 }]
    };
  }

  if (isPublicationIntent(message) && isCoauthorIntent(message) && isMostIntent(message)) {
    const top = coauthorTop().slice(0, 3);
    if (top.length) {
      const summary = top.map(([name, cnt]) => `${name} (${cnt})`).join(', ');
      return {
        reply: t(lang, `공동저자 상위는 ${summary} 입니다.`, `Top coauthors are ${summary}.`),
        docs: top.map(([name, cnt], i) => ({ type: 'coauthor', title: `${name} (${cnt})`, url: SITE_LINKS.publications, score: 1 - i * 0.1 }))
      };
    }
  }

  if (isPublicationIntent(message) && isLatestIntent(message)) {
    const latest = [...PUBLICATIONS].sort((a, b) => (b.year || 0) - (a.year || 0)).slice(0, 3);
    const lines = latest.map((p) => `${p.title} (${p.journal}, ${p.year})${p.doi ? `, DOI: ${p.doi}` : ''}`).join('\n');
    return {
      reply: t(lang, `최근 논문은 다음과 같습니다.\n${lines}`, `Recent papers:\n${lines}`),
      docs: latest.map((p, i) => ({ type: 'publication', title: p.title, journal: p.journal, year: p.year, url: p.doi || SITE_LINKS.publications, score: 1 - i * 0.1 }))
    };
  }

  if (isPublicationIntent(message) && isRepresentativeIntent(message)) {
    const rep = [...PUBLICATIONS].filter((p) => /IEEE/i.test(p.journal || '')).sort((a, b) => (b.year || 0) - (a.year || 0)).slice(0, 3);
    const lines = rep.map((p) => `${p.title} (${p.journal}, ${p.year})${p.doi ? `, DOI: ${p.doi}` : ''}`).join('\n');
    return {
      reply: t(lang, `대표 실적은 IEEE 위주로 다음과 같습니다.\n${lines}`, `Representative IEEE-focused papers:\n${lines}`),
      docs: rep.map((p, i) => ({ type: 'publication', title: p.title, journal: p.journal, year: p.year, url: p.doi || SITE_LINKS.publications, score: 1 - i * 0.1 }))
    };
  }

  if (isPublicationIntent(message)) {
    const matched = findPublicationByQuery(message);
    if (matched) {
      const authors = (matched.authors || []).join(', ');
      return {
        reply: t(lang, `${matched.title}는 ${matched.year}년 ${matched.journal} 게재 논문입니다. 저자: ${authors}.${matched.doi ? ` DOI: ${matched.doi}` : ''}`, `${matched.title} was published in ${matched.journal} (${matched.year}). Authors: ${authors}.${matched.doi ? ` DOI: ${matched.doi}` : ''}`),
        docs: [{ type: 'publication', title: matched.title, journal: matched.journal, year: matched.year, url: matched.doi || SITE_LINKS.publications, score: 1 }]
      };
    }
  }

  if (isProjectIntent(message)) {
    return {
      reply: t(lang, `현재 1인 개발 프로젝트는 Hexagon Soup이며 링크는 ${SITE_PROFILE.currentProjectUrl}입니다.`, `Current solo project: Hexagon Soup. Link: ${SITE_PROFILE.currentProjectUrl}`),
      docs: [{ type: 'project', title: SITE_PROFILE.currentProject, url: SITE_PROFILE.currentProjectUrl, score: 1 }]
    };
  }

  if (isProfileIntent(message)) {
    return {
      reply: t(lang, `${SITE_PROFILE.nameKo} 교수는 ${SITE_PROFILE.appointmentDate}부터 ${SITE_PROFILE.affiliationKo} 조교수로 재직 중입니다.`, `${SITE_PROFILE.nameEn} has been Assistant Professor at ${SITE_PROFILE.affiliationEn} since ${SITE_PROFILE.appointmentDate}.`),
      docs: [{ type: 'profile', title: `${SITE_PROFILE.nameKo} (${SITE_PROFILE.nameEn})`, url: SITE_LINKS.aboutKo, score: 1 }]
    };
  }

  return null;
}

function buildPrompt(message, history, retrieved, lang) {
  const recent = (history || []).slice(-6).map((h) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`).join('\n');
  const context = (retrieved || []).map((r, i) => {
    const d = r.doc || r;
    return `[${i + 1}] type=${d.type}\ntitle=${d.title}\nurl=${d.url || 'N/A'}\ncontent=${d.text}`;
  }).join('\n\n');

  return [
    `You are the official assistant for ${SITE_PROFILE.nameEn}'s homepage.`,
    'Rules:',
    '- Use only provided facts/context.',
    '- Do not output stale seminar sales text.',
    `- Official contact email is ${SITE_PROFILE.email}.`,
    '- Never mention chaos@sayberrygames.com.',
    '- For publication questions, prioritize title/year/journal/DOI.',
    `- Answer in ${lang === 'ko' ? 'Korean' : 'English'}.`,
    '',
    `Question: ${message}`,
    '',
    `Recent conversation:\n${recent || '(none)'}`,
    '',
    `Retrieved context:\n${context || '(none)'}`
  ].join('\n');
}

async function generateReply(prompt, apiKey) {
  if (!apiKey) return null;
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 800 }
      })
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (error) {
    console.error('Generate reply error:', error);
    return null;
  }
}

async function logToSupabase(event, message, reply, history, action, searchResults) {
  try {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
    if (!url || !key) return;
    const supabase = createClient(url, key);
    const ip = event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown';
    await supabase.from('chat_logs').insert([{
      user_message: message,
      bot_response: reply,
      conversation_history: Array.isArray(history) ? history.slice(-MAX_HISTORY) : [],
      action_taken: action || null,
      search_results: Array.isArray(searchResults) ? searchResults : null,
      user_ip: ip,
      user_agent: event.headers['user-agent'] || 'unknown'
    }]);
  } catch (error) {
    console.error('Supabase logging error:', error);
  }
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    const body = JSON.parse(event.body || '{}');
    const message = String(body.message || '').trim();
    const history = Array.isArray(body.history) ? body.history.slice(-MAX_HISTORY) : [];
    const step = Number(body.step || 1);
    if (!message) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Message required' }) };

    const lang = detectLanguage(message, history);

    if (step === 1) {
      const decision = classifyStep1(message, lang);
      if (decision.action === 'CHAT') {
        await logToSupabase(event, message, decision.initialMessage, history, decision.action, null);
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
    if (action === 'CHAT' || isGreetingOnlyMessage(message)) {
      const reply = `${t(lang, 'greeting')} ${t(lang, 'chatHint')}`;
      await logToSupabase(event, message, reply, history, 'CHAT', null);
      return { statusCode: 200, headers, body: JSON.stringify({ step: 2, reply, searchResults: null, searchResultsDetailed: null }) };
    }

    const det = deterministic(message, lang);
    if (det) {
      const payload = buildSearchPayload(det.docs || [], lang);
      await logToSupabase(event, message, det.reply, history, action, payload.searchResults);
      return { statusCode: 200, headers, body: JSON.stringify({ step: 2, reply: det.reply, searchResults: payload.searchResults, searchResultsDetailed: payload.searchResultsDetailed }) };
    }

    const apiKey = process.env.GEMINI_API_KEY || '';
    const query = String(body.query || message).trim();
    const retrieved = await retrieve(query, apiKey);
    const payload = buildSearchPayload(retrieved, lang);

    let reply = null;
    if (apiKey) {
      reply = await generateReply(buildPrompt(message, history, retrieved, lang), apiKey);
    }

    if (!reply || (!isGreetingOnlyMessage(message) && isGenericGreetingReply(reply))) {
      if (retrieved.length) {
        const top = retrieved[0].doc || retrieved[0];
        reply = `${t(lang, 'resultsHint')} "${top.title}"`;
      } else {
        reply = `${t(lang, 'fallback')} ${SITE_LINKS.publications}`;
      }
    }

    if (isContactIntent(message) && !reply.includes(SITE_PROFILE.email)) {
      reply = `${reply}\n\n${t(lang, 'contactLabel')}: ${SITE_PROFILE.email}`;
    }

    await logToSupabase(event, message, reply, history, action, payload.searchResults);
    return { statusCode: 200, headers, body: JSON.stringify({ step: 2, reply, searchResults: payload.searchResults, searchResultsDetailed: payload.searchResultsDetailed }) };
  } catch (error) {
    console.error('chat-ai-driven error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error' }) };
  }
};
